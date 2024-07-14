import { Injectable, Logger } from '@nestjs/common';
import common from 'oci-common';
import * as os from 'oci-objectstorage';
import {
  ConfigFileAuthenticationDetailsProvider,
  objectstorage,
} from 'oci-sdk';
import { Readable } from 'stream';

@Injectable()
export class OracleService {
  public namespaceName = process.env.ORACLE_NAMESPACE;
  public bucketName = process.env.ORACLE_BUCKET_NAME;
  public region = process.env.ORACLE_REGION;

  private readonly logger = new Logger(OracleService.name);

  private client() {
    const provider: common.ConfigFileAuthenticationDetailsProvider =
      new ConfigFileAuthenticationDetailsProvider();

    return new os.ObjectStorageClient({
      authenticationDetailsProvider: provider,
    });
  }

  async upload(file: Express.Multer.File, folder = '', originalName = false) {
    const stream = new Readable();

    stream.push(file.buffer);
    stream.push(null);

    const mime = file.mimetype.split('/');

    let name = this.generateName(mime[mime.length - 1]);

    if (originalName) {
      name = file.originalname;
    }

    const request: os.requests.PutObjectRequest = {
      namespaceName: this.namespaceName,
      bucketName: this.bucketName,
      objectName: `${folder}/${name}`, // TODO: Does this work if you put an object in the main folder?
      putObjectBody: stream,
      contentLength: stream.readableLength,
    };

    try {
      const client = this.client();

      await client.putObject(request);
      this.logger.debug(`Uploaded file (${folder}/${name}) to Oracle`);
      return name;
    } catch (e) {
      return e;
    }
  }

  rename(sourceName: string, newName: string) {
    const client = this.client();

    const renameObjectDetails = {
      sourceName,
      newName,
    } as os.models.RenameObjectDetails;

    const request: os.requests.RenameObjectRequest = {
      namespaceName: this.namespaceName,
      bucketName: this.bucketName,
      renameObjectDetails: renameObjectDetails,
    };

    return client.renameObject(request);
  }

  async renameFolder(sourceFolder: string, destinationFolder: string) {
    const client = this.client();

    const listObjectsRequest = {
      namespaceName: this.namespaceName,
      bucketName: this.bucketName,
      prefix: sourceFolder,
    } as os.requests.ListObjectsRequest;

    const res = await client.listObjects(listObjectsRequest);
    const objects = res.listObjects.objects;

    for (const object of objects) {
      const fileName = object.name.split('/').pop();
      await this.rename(object.name, `${destinationFolder}/${fileName}`);
    }

    return;
  }

  public async remove(path: string) {
    const client = this.client();

    const request: objectstorage.requests.DeleteObjectRequest = {
      namespaceName: this.namespaceName,
      bucketName: this.bucketName,
      objectName: path,
    };

    return client.deleteObject(request);
  }

  private generateName(type: string) {
    return `${Date.now()}-${Math.round(Math.random() * 1e9)}.${type}`;
  }
}
