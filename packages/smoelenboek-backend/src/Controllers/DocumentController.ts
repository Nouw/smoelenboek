import { Controller, Delete, Get, Next, Post, Put, Request, Response } from "@decorators/express";
import { Authenticated, Guard, IsAdmin } from "../Middlewares/AuthMiddleware";
import { Database } from "../Database";
import { Category, Season, File } from "smoelenboek-types";
import moment from "moment";
import ResponseData from "../Utilities/ResponseData";
import multer from "multer";
import Oracle from "../Utilities/Oracle";
import DocumentRepository from "../Repository/DocumentRepository";
import { matchedData, param, query } from "express-validator";
import { OciError } from "oci-sdk";
import logger from "../Utilities/Logger";
import crypto from "crypto";
import { RequestE } from "../Utilities/RequestE";

const oracleUpload = multer({ storage: multer.memoryStorage() });

@Controller("/documents")
export default class DocumentController {
	private oracle = new Oracle();
	private documentRepository = new DocumentRepository();

	@Authenticated()
	@Get("/", [query("raw").toBoolean()])
	async getCategories(@Request() req: RequestE, @Response() res) {
		const { raw } = matchedData(req);

		const categories = await Database.manager.find(Category, { order: { pinned: "DESC" } });

		if (raw) {
			const result = await Database.manager.find(Category, { order: { created: "DESC" } });
			res.json(ResponseData.build("OK", result));
			return;
		}

		const seasons = await Database.manager.find(Season, { order: { endDate: "DESC" } });

		const data = {};

		for (const season of seasons) {
			if (moment(season.endDate).isBefore(req.user.joinDate) && !IsAdmin(req.user)) {
				continue;
			}

			data[season.name] = { categories: [], ...season };
		}

		for (const category of categories) {
			const season = seasons.find((a) => moment(a.startDate).isBefore(category.created) && moment(a.endDate).isAfter(category.created));
			// Skip because the user does not have access to the season
			if (data[season.name] === undefined) {
				continue;
			}

			data[season.name].categories.push({ id: category.id, name: category.name });
		}

		res.json(ResponseData.build("OK", data, ""));
	}

	@Authenticated()
	@Get("/files/:id")
	async getDocuments(@Request() req, @Response() res) {
		const { id } = req.params;

		const files = await this.documentRepository.getDocumentsByCategory(parseInt(id));

		res.json(ResponseData.build("OK", files));
	}

	@Authenticated()
	@Guard(["CREATE_DOCUMENT"])
	@Post("/upload", [oracleUpload.array("documents")])
	async uploadFiles(@Request() req, @Response() res) {
		const files = req.files;
		const { id } = req.body;

		const category = await Database.manager.findOneBy(Category, { id: parseInt(id) });
		const fileEntities = [];

		for (const file of files) {
			const folder = crypto.createHash("md5").update(category.name).digest("hex");
			const filename = await this.oracle.upload(file, folder, category.type === "documents");

			fileEntities.push({
				path: `${folder}/${filename}`,
				originalName: file.originalname,
				category,
			});
		}

		await Database.manager.save(File, fileEntities);

		res.json(ResponseData.build("OK", fileEntities));
	}

	@Authenticated()
	@Guard(["DELETE_DOCUMENT"])
	@Delete("/")
	async deleteFile(@Request() req, @Response() res, @Next() next) {
		const docs: number[] = req.body.docs;

		for (const doc of docs) {
			const entity = await Database.manager.findOne(File, { where: { id: doc } });

			if (!entity) {
				next(new Error(`Entity not found with id: ${doc}`));
				return;
			}

			await this.oracle.remove(entity.path);

			await Database.manager.delete(File, { id: entity.id });
		}

		res.json(ResponseData.build("OK", null, "Deleted documents!"));
	}

	@Authenticated()
	@Guard(["CREATE_DOCUMENT"])
	@Post("/category")
	async createCategory(@Request() req, @Response() res, @Next() next) {
		const { name, type } = req.body;

		const duplicate = await Database.manager.find(Category, { where: { name } });

		if (duplicate.length > 0) {
			next(new Error("Category already exists!"));
			return;
		}

		let category = new Category();

		category.name = name;
		category.type = type;
		category.created = new Date();

		category = await Database.manager.save(category);

		res.json(ResponseData.build("OK", category, `Created ${name}`));
	}

	@Authenticated()
	@Guard(["UPDATE_DOCUMENT"])
	@Put("/category")
	async updateCategory(@Request() req, @Response() res, @Next() next) {
		const { id, name, pinned } = req.body;

		const category = await Database.manager.findOne(Category, { where: { id: parseInt(id) } });

		if (!category) {
			next(new Error("Category does not exist!"));
			return;
		}

		if (name) {
			// TODO: Check error handling?
			await this.oracle.renameFolder(category.name, name);
			category.name = name;
		}

		if ((pinned || pinned === false) && pinned !== category.pinned) {
			category.pinned = pinned;
		}

		await Database.manager.save(category);

		res.json(ResponseData.build("OK", category, "Updated category!"));
	}

	@Authenticated()
	@Guard(["DELETE_DOCUMENT"])
	@Delete("/category")
	async deleteCategory(@Request() req, @Response() res, @Next() next) {
		const { id } = req.body;

		const category = await Database.manager.findOne(Category, { where: { id: parseInt(id) } });

		if (!category) {
			next(new Error("Category does not exist!"));
			return;
		}

		const files = await Database.manager.createQueryBuilder(File, "f").where("f.category.id = :id", { id: parseInt(id) }).getMany();

		for (const file of files) {
			try {
				await this.oracle.remove(file.path);
			} catch (e) {
				if (e instanceof OciError) {
					if (e.serviceCode === "ObjectNotFound") {
						logger.warn("Object not found in bucket!");
					}
				} else {
					throw e;
				}
			}
			await Database.manager.delete(File, file.id);
		}

		try {
			await this.oracle.remove(`${category.name}/`);
		} catch (e) {
			if (e instanceof  OciError) {
				if (e.serviceCode === "ObjectNotFound") {
					logger.warn("Object not found in bucket!");
				}
			} else {
				throw e;
			}
		}

		await Database.manager.delete(Category, category.id);

		res.json(ResponseData.build("OK", null, "Deleted category!"));
	}
}
