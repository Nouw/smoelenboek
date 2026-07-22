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

const allowedObjectPrefixes = ['profile-images/', 'team-images/', 'photobooks/', 'team/'];

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

  async deleteObjectByUrl(objectUrl: string | null | undefined): Promise<void> {
    if (!objectUrl) {
      return;
    }

    const objectName = this.objectNameFromUrl(objectUrl);

    if (!objectName) {
      return;
    }

    const client = await this.getClient();
    await client.deleteObject({
      namespaceName: this.requiredEnv('OCI_OBJECT_STORAGE_NAMESPACE'),
      bucketName: this.requiredEnv('OCI_OBJECT_STORAGE_BUCKET'),
      objectName,
    });
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
