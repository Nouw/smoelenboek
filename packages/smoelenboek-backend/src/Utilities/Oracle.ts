import common from "oci-common";
import * as os from "oci-objectstorage";
import { ConfigFileAuthenticationDetailsProvider, objectstorage } from "oci-sdk";
import { Readable } from "stream";
import logger from "./Logger";

export default class Oracle {
	public static namespaceName = process.env.ORACLE_NAMESPACE;
	public static bucketName = process.env.ORACLE_BUCKET_NAME;

	public async client() {
		const provider: common.ConfigFileAuthenticationDetailsProvider = new ConfigFileAuthenticationDetailsProvider();

		return new os.ObjectStorageClient({
			authenticationDetailsProvider: provider
		});
	}

	public async upload(file: Express.Multer.File, folder = "", originalName = false): Promise<string> {
		const stream = new Readable();

		stream.push(file.buffer);
		stream.push(null);

		const mime = file.mimetype.split("/");

		let name = this.generateName(mime[mime.length - 1]);

		if (originalName) {
			name = file.originalname;
		}

		const request: os.requests.PutObjectRequest = {
			namespaceName: Oracle.namespaceName,
			bucketName: Oracle.bucketName,
			objectName: `${folder}/${name}`, // TODO: Does this work if you put an object in the main folder?
			putObjectBody: stream,
			contentLength: stream.readableLength
		};

		try {
			const client = await this.client();

			await client.putObject(request);

			return name;
		} catch (e) {
			logger.error(e);

			return e;
		}
	}

	public async rename(sourceName: string, newName: string) {
		const client = await this.client();

		const renameObjectDetails = {
			sourceName,
			newName,
		};

		const request: os.requests.RenameObjectRequest = {
			namespaceName: Oracle.namespaceName,
			bucketName: Oracle.bucketName,
			renameObjectDetails
		};

		return client.renameObject(request);
	}

	public async remove(path: string) {
		const client = await this.client();

		const request: objectstorage.requests.DeleteObjectRequest = {
			namespaceName: Oracle.namespaceName,
			bucketName: Oracle.bucketName,
			objectName: path
		};

		return client.deleteObject(request);
	}

	private generateName(type: string) {
		return `${Date.now()}-${Math.round(Math.random() * 1e9)}.${type}`;
	}
}
