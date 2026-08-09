import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Readable } from 'node:stream';
import { ReadableStream as WebReadableStream } from 'node:stream/web';

const maxImageBytes = 5 * 1024 * 1024;

const imageExtensionsByMimeType = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

const allowedObjectPrefixes = [
  'profile-images/',
  'team-images/',
  'photobooks/',
  'documents/',
  'team/',
  'sponsorhengel/',
];

const maxPhotoBytes = 15 * 1024 * 1024;
const maxDocumentBytes = 25 * 1024 * 1024;

const contentExtensionsByMimeType = new Map([
  ...imageExtensionsByMimeType,
  ['application/pdf', 'pdf'],
  ['application/msword', 'doc'],
  [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'docx',
  ],
  ['application/vnd.ms-excel', 'xls'],
  [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xlsx',
  ],
  ['application/vnd.ms-powerpoint', 'ppt'],
  [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'pptx',
  ],
]);

export type UploadedObject = {
  objectName: string;
  imageUrl: string;
};

export type UploadedImage = UploadedObject;

export type ImageUploadFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type ContentCollectionKind = 'photo_album' | 'document_library';

export type UploadedContentObjects = {
  objectName: string;
  thumbnailObjectName: string | null;
  contentType: string;
  sizeBytes: number;
};

export class MediaUploadCompensationError extends Error {
  constructor(
    message: string,
    public readonly orphanedObjectNames: string[],
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'MediaUploadCompensationError';
  }
}

type OciObjectStorageClient = {
  putObject(input: {
    namespaceName: string;
    bucketName: string;
    objectName: string;
    putObjectBody: Buffer;
    contentType: string;
    contentLength: number;
  }): Promise<unknown>;
  deleteObject(input: {
    namespaceName: string;
    bucketName: string;
    objectName: string;
  }): Promise<unknown>;
  getObject(input: {
    namespaceName: string;
    bucketName: string;
    objectName: string;
  }): Promise<{
    value?: unknown;
    contentLength?: number;
    contentType?: string;
    eTag?: string;
  }>;
};

export type StoredObject = {
  content: Readable;
  contentLength: number | null;
  contentType: string;
  etag: string | null;
};

export type StoredImage = StoredObject;

type OciModules = {
  common: {
    SimpleAuthenticationDetailsProvider: new (
      tenancyId: string,
      userId: string,
      fingerprint: string,
      privateKey: string,
      passphrase: string | null,
      region: unknown,
    ) => unknown;
    Region: { fromRegionId(regionId: string): unknown };
  };
  objectStorage: {
    ObjectStorageClient: new (options: {
      authenticationDetailsProvider: unknown;
    }) => OciObjectStorageClient;
  };
};

@Injectable()
export class MediaService {
  private clientPromise: Promise<OciObjectStorageClient> | null = null;

  async uploadImage(
    scope: 'profile-images' | 'team-images',
    ownerId: string,
    file: ImageUploadFile,
  ): Promise<UploadedObject> {
    this.validateImage(file);

    const extension =
      imageExtensionsByMimeType.get(file.mimetype) ??
      this.safeExtension(file.originalname);
    const objectName = `${scope}/${ownerId}/${randomUUID()}.${extension}`;
    const client = await this.getClient();

    await client.putObject({
      namespaceName: this.requiredEnv('OCI_OBJECT_STORAGE_NAMESPACE'),
      bucketName: this.requiredEnv('OCI_OBJECT_STORAGE_BUCKET'),
      objectName,
      putObjectBody: file.buffer,
      contentType: file.mimetype,
      contentLength: file.size,
    });

    return {
      objectName,
      imageUrl: this.toRpcObjectUrl(objectName),
    };
  }

  async uploadContentAsset(
    kind: ContentCollectionKind,
    collectionId: string,
    assetId: string,
    file: ImageUploadFile,
  ): Promise<UploadedContentObjects> {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    if (!file.originalname || file.originalname.length > 255) {
      throw new BadRequestException('Filename must be between 1 and 255 characters.');
    }

    const maximumBytes =
      kind === 'photo_album' ? maxPhotoBytes : maxDocumentBytes;

    if (file.size > maximumBytes) {
      throw new BadRequestException(
        `File must be ${maximumBytes / 1024 / 1024} MB or smaller.`,
      );
    }

    const detected = this.normalizeLegacyOfficeType(
      await this.detectFileType(file.buffer),
      file.originalname,
    );

    if (!detected || !contentExtensionsByMimeType.has(detected.mime)) {
      throw new BadRequestException('The file type is not supported.');
    }

    const isImage = imageExtensionsByMimeType.has(detected.mime);

    if (kind === 'photo_album' && !isImage) {
      throw new BadRequestException('Photo albums only support image files.');
    }

    const prefix = kind === 'photo_album' ? 'photobooks' : 'documents';
    const extension = contentExtensionsByMimeType.get(detected.mime)!;
    const objectName = `${prefix}/${collectionId}/original/${assetId}.${extension}`;
    const thumbnailObjectName = isImage
      ? `${prefix}/${collectionId}/thumbnail/${assetId}.webp`
      : null;
    const client = await this.getClient();
    const storage = {
      namespaceName: this.requiredEnv('OCI_OBJECT_STORAGE_NAMESPACE'),
      bucketName: this.requiredEnv('OCI_OBJECT_STORAGE_BUCKET'),
    };

    await client.putObject({
      ...storage,
      objectName,
      putObjectBody: file.buffer,
      contentType: detected.mime,
      contentLength: file.buffer.length,
    });

    if (thumbnailObjectName) {
      try {
        const thumbnail = await this.createThumbnail(file.buffer);
        await client.putObject({
          ...storage,
          objectName: thumbnailObjectName,
          putObjectBody: thumbnail,
          contentType: 'image/webp',
          contentLength: thumbnail.length,
        });
      } catch (error) {
        try {
          await this.deleteObjectByName(objectName);
        } catch {
          throw new MediaUploadCompensationError(
            'Thumbnail creation failed and the uploaded original requires cleanup.',
            [objectName],
            { cause: error },
          );
        }
        throw error;
      }
    }

    return {
      objectName,
      thumbnailObjectName,
      contentType: detected.mime,
      sizeBytes: file.buffer.length,
    };
  }

  async uploadPdfObject(
    objectName: string,
    file: ImageUploadFile,
  ): Promise<{ sizeBytes: number }> {
    this.assertAllowedObjectName(objectName);
    if (!file) throw new BadRequestException('File is required.');
    if (!file.originalname || file.originalname.length > 255) {
      throw new BadRequestException('Filename must be between 1 and 255 characters.');
    }
    if (file.size > maxDocumentBytes) {
      throw new BadRequestException('File must be 25 MB or smaller.');
    }
    const detected = await this.detectFileType(file.buffer);
    if (detected?.mime !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are supported.');
    }
    const client = await this.getClient();
    await client.putObject({
      namespaceName: this.requiredEnv('OCI_OBJECT_STORAGE_NAMESPACE'),
      bucketName: this.requiredEnv('OCI_OBJECT_STORAGE_BUCKET'),
      objectName,
      putObjectBody: file.buffer,
      contentType: 'application/pdf',
      contentLength: file.buffer.length,
    });
    return { sizeBytes: file.buffer.length };
  }

  async deleteObjectByName(objectName: string): Promise<void> {
    this.assertAllowedObjectName(objectName);
    const client = await this.getClient();
    try {
      await client.deleteObject({
        namespaceName: this.requiredEnv('OCI_OBJECT_STORAGE_NAMESPACE'),
        bucketName: this.requiredEnv('OCI_OBJECT_STORAGE_BUCKET'),
        objectName,
      });
    } catch (error) {
      if (!this.isOciNotFound(error)) throw error;
    }
  }

  async deleteObjectByUrl(objectUrl: string | null | undefined): Promise<void> {
    if (!objectUrl) {
      return;
    }

    const objectName = this.objectNameFromUrl(objectUrl);

    if (!objectName) {
      return;
    }

    await this.deleteObjectByName(objectName);
  }

  async deleteImageByUrl(imageUrl: string | null | undefined): Promise<void> {
    await this.deleteObjectByUrl(imageUrl);
  }

  async getObjectByName(objectName: string): Promise<StoredObject> {
    this.assertAllowedObjectName(objectName);
    const client = await this.getClient();

    try {
      const object = await client.getObject({
        namespaceName: this.requiredEnv('OCI_OBJECT_STORAGE_NAMESPACE'),
        bucketName: this.requiredEnv('OCI_OBJECT_STORAGE_BUCKET'),
        objectName,
      });
      const value = this.objectBody(object);

      if (!value) {
        throw new NotFoundException('Object not found.');
      }

      return {
        content: this.toReadable(value.content),
        contentLength:
          typeof value.contentLength === 'number' ? value.contentLength : null,
        contentType: value.contentType ?? this.contentTypeFromObjectName(objectName),
        etag: value.eTag ?? null,
      };
    } catch (error) {
      if (error instanceof NotFoundException || this.isOciNotFound(error)) {
        throw new NotFoundException('Object not found.');
      }

      throw error;
    }
  }

  async getImageByObjectName(objectName: string): Promise<StoredObject> {
    return this.getObjectByName(objectName);
  }

  toRpcObjectUrl(objectName: string): string {
    this.assertAllowedObjectName(objectName);

    return `${this.rpcBaseUrl()}/media/objects/${this.encodeObjectName(objectName)}`;
  }

  toRpcImageUrl(objectName: string): string {
    return this.toRpcObjectUrl(objectName);
  }

  legacyOciPublicUrlBase(): string {
    const region = this.requiredEnv('OCI_REGION');
    const namespace = encodeURIComponent(
      this.requiredEnv('OCI_OBJECT_STORAGE_NAMESPACE'),
    );
    const bucket = encodeURIComponent(this.requiredEnv('OCI_OBJECT_STORAGE_BUCKET'));

    return `https://objectstorage.${region}.oraclecloud.com/n/${namespace}/b/${bucket}/o`;
  }

  objectNameFromUrl(imageUrl: string): string | null {
    const rpcObjectBaseUrl = `${this.rpcBaseUrl()}/media/objects/`;

    if (imageUrl.startsWith(rpcObjectBaseUrl)) {
      return this.decodeObjectName(imageUrl.slice(rpcObjectBaseUrl.length));
    }

    const rpcImageBaseUrl = `${this.rpcBaseUrl()}/media/images/`;

    if (imageUrl.startsWith(rpcImageBaseUrl)) {
      return this.decodeObjectName(imageUrl.slice(rpcImageBaseUrl.length));
    }

    const legacyBaseUrl = `${this.legacyOciPublicUrlBase()}/`;

    if (!imageUrl.startsWith(legacyBaseUrl)) {
      return null;
    }

    return this.decodeObjectName(imageUrl.slice(legacyBaseUrl.length));
  }

  assertAllowedObjectName(objectName: string): void {
    if (
      !objectName ||
      objectName.includes('..') ||
      objectName.startsWith('/') ||
      !allowedObjectPrefixes.some((prefix) => objectName.startsWith(prefix))
    ) {
      throw new BadRequestException('Object name is not allowed.');
    }
  }

  private validateImage(file: ImageUploadFile): void {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    if (!imageExtensionsByMimeType.has(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and GIF images are supported.');
    }

    if (file.size > maxImageBytes) {
      throw new BadRequestException('Image must be 5 MB or smaller.');
    }
  }

  private encodeObjectName(objectName: string): string {
    return objectName
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
  }

  private decodeObjectName(encodedObjectName: string): string | null {
    if (!encodedObjectName) {
      return null;
    }

    try {
      const objectName = encodedObjectName
        .split('/')
        .map((part) => decodeURIComponent(part))
        .join('/');

      this.assertAllowedObjectName(objectName);
      return objectName;
    } catch {
      return null;
    }
  }

  private rpcBaseUrl(): string {
    return this.requiredEnv('BETTER_AUTH_URL').replace(/\/+$/, '');
  }

  private contentTypeFromObjectName(objectName: string): string {
    const extension = extname(objectName).toLowerCase();

    if (extension === '.jpg' || extension === '.jpeg') {
      return 'image/jpeg';
    }

    if (extension === '.png') {
      return 'image/png';
    }

    if (extension === '.webp') {
      return 'image/webp';
    }

    if (extension === '.gif') {
      return 'image/gif';
    }

    return 'application/octet-stream';
  }

  private toReadable(content: unknown): Readable {
    if (content instanceof Readable) {
      return content;
    }

    if (this.isWebReadableStream(content)) {
      return Readable.fromWeb(content);
    }

    if (Buffer.isBuffer(content)) {
      return Readable.from(content);
    }

    if (content instanceof Uint8Array) {
      return Readable.from(Buffer.from(content));
    }

    if (content instanceof ArrayBuffer) {
      return Readable.from(Buffer.from(content));
    }

    if (typeof content === 'string') {
      return Readable.from(Buffer.from(content));
    }

    throw new BadGatewayException('Object storage returned an unsupported body.');
  }

  private isWebReadableStream(content: unknown): content is WebReadableStream {
    return (
      typeof WebReadableStream !== 'undefined' &&
      content instanceof WebReadableStream
    );
  }

  private objectBody(object: {
    value?: unknown;
    contentLength?: number;
    contentType?: string;
    eTag?: string;
  }):
    | {
        content: unknown;
        contentLength?: number;
        contentType?: string;
        eTag?: string;
      }
    | null {
    const value = object.value;

    if (!value) {
      return null;
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      'content' in value
    ) {
      const legacyValue = value as {
        content?: unknown;
        contentLength?: number;
        contentType?: string;
        eTag?: string;
      };

      if (!legacyValue.content) {
        return null;
      }

      return {
        content: legacyValue.content,
        contentLength: legacyValue.contentLength,
        contentType: legacyValue.contentType,
        eTag: legacyValue.eTag,
      };
    }

    return {
      content: value,
      contentLength: object.contentLength,
      contentType: object.contentType,
      eTag: object.eTag,
    };
  }

  private isOciNotFound(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      (error as { statusCode?: unknown }).statusCode === 404
    );
  }

  private safeExtension(filename: string): string {
    return extname(filename).replace(/^\./, '').toLowerCase() || 'img';
  }

  private async detectFileType(
    buffer: Buffer,
  ): Promise<{ ext: string; mime: string } | undefined> {
    const module = (await importModule('file-type')) as {
      fileTypeFromBuffer(value: Uint8Array): Promise<
        { ext: string; mime: string } | undefined
      >;
    };

    return module.fileTypeFromBuffer(buffer);
  }

  private normalizeLegacyOfficeType(
    detected: { ext: string; mime: string } | undefined,
    filename: string,
  ): { ext: string; mime: string } | undefined {
    if (detected?.mime !== 'application/x-cfb') return detected;

    const extension = extname(filename).toLowerCase();
    if (extension === '.doc') return { ext: 'doc', mime: 'application/msword' };
    if (extension === '.xls') {
      return { ext: 'xls', mime: 'application/vnd.ms-excel' };
    }
    if (extension === '.ppt') {
      return { ext: 'ppt', mime: 'application/vnd.ms-powerpoint' };
    }
    return undefined;
  }

  private async createThumbnail(buffer: Buffer): Promise<Buffer> {
    const module = (await importModule('sharp')) as {
      default?: (input: Buffer, options?: { animated?: boolean }) => {
        rotate(): unknown;
      };
    };
    const sharp = (module.default ?? module) as unknown as (
      input: Buffer,
      options?: { animated?: boolean },
    ) => {
      rotate(): {
        resize(options: {
          width: number;
          height: number;
          fit: 'inside';
          withoutEnlargement: boolean;
        }): {
          webp(options: { quality: number }): { toBuffer(): Promise<Buffer> };
        };
      };
    };

    return sharp(buffer, { animated: false })
      .rotate()
      .resize({
        width: 480,
        height: 480,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
  }

  private async getClient(): Promise<OciObjectStorageClient> {
    this.clientPromise ??= this.createClient();

    return this.clientPromise;
  }

  private async createClient(): Promise<OciObjectStorageClient> {
    const { common, objectStorage } = await this.importOciModules();
    const provider = new common.SimpleAuthenticationDetailsProvider(
      this.requiredEnv('OCI_TENANCY_OCID'),
      this.requiredEnv('OCI_USER_OCID'),
      this.requiredEnv('OCI_FINGERPRINT'),
      this.requiredEnv('OCI_PRIVATE_KEY').replace(/\\n/g, '\n'),
      process.env.OCI_PRIVATE_KEY_PASSPHRASE ?? null,
      common.Region.fromRegionId(this.requiredEnv('OCI_REGION')),
    );

    return new objectStorage.ObjectStorageClient({
      authenticationDetailsProvider: provider,
    });
  }

  private async importOciModules(): Promise<OciModules> {
    const [common, objectStorage] = await Promise.all([
      importModule('oci-common'),
      importModule('oci-objectstorage'),
    ]);

    return { common, objectStorage } as OciModules;
  }

  private requiredEnv(key: string): string {
    const value = process.env[key];

    if (!value) {
      throw new Error(`${key} is required for media storage.`);
    }

    return value;
  }
}

function importModule(specifier: string): Promise<unknown> {
  const dynamicImport = new Function(
    'specifier',
    'return import(specifier)',
  ) as (moduleSpecifier: string) => Promise<unknown>;

  return dynamicImport(specifier);
}
