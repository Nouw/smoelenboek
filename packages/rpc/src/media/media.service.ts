import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

const maxImageBytes = 5 * 1024 * 1024;

const imageExtensionsByMimeType = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

export type UploadedImage = {
  objectName: string;
  imageUrl: string;
};

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
  }): Promise<{ value?: { content?: unknown } }>;
};

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
  ): Promise<UploadedImage> {
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
      imageUrl: this.toPublicUrl(objectName),
    };
  }

  async deleteImageByUrl(imageUrl: string | null | undefined): Promise<void> {
    if (!imageUrl) {
      return;
    }

    const objectName = this.objectNameFromUrl(imageUrl);

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

  async getImageByUrl(imageUrl: string): Promise<unknown | null> {
    const objectName = this.objectNameFromUrl(imageUrl);

    if (!objectName) {
      return null;
    }

    const client = await this.getClient();
    const object = await client.getObject({
      namespaceName: this.requiredEnv('OCI_OBJECT_STORAGE_NAMESPACE'),
      bucketName: this.requiredEnv('OCI_OBJECT_STORAGE_BUCKET'),
      objectName,
    });

    return object.value?.content ?? null;
  }

  publicUrlBase(): string {
    const customBaseUrl = process.env.OCI_OBJECT_STORAGE_PUBLIC_BASE_URL;

    if (customBaseUrl) {
      return customBaseUrl.replace(/\/+$/, '');
    }

    const region = this.requiredEnv('OCI_REGION');
    const namespace = encodeURIComponent(
      this.requiredEnv('OCI_OBJECT_STORAGE_NAMESPACE'),
    );
    const bucket = encodeURIComponent(this.requiredEnv('OCI_OBJECT_STORAGE_BUCKET'));

    return `https://objectstorage.${region}.oraclecloud.com/n/${namespace}/b/${bucket}/o`;
  }

  objectNameFromUrl(imageUrl: string): string | null {
    const baseUrl = `${this.publicUrlBase()}/`;

    if (!imageUrl.startsWith(baseUrl)) {
      return null;
    }

    const path = imageUrl.slice(baseUrl.length);

    if (!path) {
      return null;
    }

    return path
      .split('/')
      .map((part) => decodeURIComponent(part))
      .join('/');
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

  private toPublicUrl(objectName: string): string {
    const encodedObjectName = objectName
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');

    return `${this.publicUrlBase()}/${encodedObjectName}`;
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
