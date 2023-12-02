import { Controller, Delete, Get, Next, Post, Put, Request, Response } from "@decorators/express";
import { Authenticated, Guard } from "../Middlewares/AuthMiddleware";
import { Database } from "../Database";
import { Season } from "smoelenboek-types";
import ResponseData from "../Utilities/ResponseData";
import { body, matchedData, validationResult, param, query } from "express-validator";

@Controller("/season")
export default class SeasonController {
	@Authenticated()
	@Guard("season.edit")
	@Get("/list")
	async getSeasons(@Request() req, @Response() res) {
		const seasons = await Database.manager.find(Season);

		res.json(ResponseData.build("OK", seasons));
	}

	@Authenticated()
	@Guard("season.edit")
	@Get("/info/:id")
	async get(@Request() req, @Response() res, @Next() next) {
		const season = await Database.manager.findOneBy(Season, { id: parseInt(req.params.id) });

		if (!season) {
			next(new Error(`Could not find season with id ${req.params.id}`));
		}

		res.json(ResponseData.build("OK", season));
	}

	@Authenticated()
	@Guard("season.edit")
	@Post("/", [body(["startDate", "endDate"]).exists().toDate()])
	async post(@Request() req, @Response() res, @Next() next) {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			next(new Error(errors.array()[0].msg));
			return;
		}

		const { startDate, endDate } = matchedData(req);

		const season = new Season();
		season.name = `${startDate.getFullYear()}-${endDate.getFullYear()}`;
		season.startDate = startDate;
		season.endDate = endDate;
		season.current = false;

		await Database.manager.save(season);

		res.json(ResponseData.build("OK", season, "Created season!"));
	}

	@Authenticated()
	@Guard("season.edit")
	@Put("/:id", [body(["startDate", "endDate"]).toDate(), body("current").toBoolean()])
	async put(@Request() req, @Response() res, @Next() next) {
		const { startDate, endDate, current } = matchedData(req);

		const season = await Database.manager.findOneBy(Season, { id: parseInt(req.params.id) });

		if (!season) {
			next(new Error(`Could not find season with id: ${req.params.id}`));
		}

		season.startDate = startDate;
		season.endDate = endDate;
		season.current = current;

		await Database.manager.save(season);

		res.json(ResponseData.build("OK", season, "Updated season!"));
	}

	@Authenticated()
	@Guard("season.edit")
	@Delete("/:id")
	async remove(@Request() req, @Response() res) {
		const { id } = req.params;
		try {
			await Database.manager.delete(Season, { id: parseInt(id) });
		} catch (e) {
			console.error(e);
		}

		res.json(ResponseData.build("OK", null, "Deleted season!"));
	}

  @Authenticated()
  @Guard("season.edit")
  @Get("/overlap/:date", [param("date").toDate(), query("id").default(0).toInt()])
	async overlap(@Request() req, @Response() res) {
		const { date, id } = matchedData(req);

		const seasons = await Database.createQueryBuilder(Season, "s")
			.where(":date BETWEEN s.startDate AND s.endDate", { date })
			.andWhere("s.id != :id", { id })
			.getMany();

		let result = true;

		if (seasons.length > 0) {
			result = false;
		}


		res.json(ResponseData.build("OK", result));
	}
}
