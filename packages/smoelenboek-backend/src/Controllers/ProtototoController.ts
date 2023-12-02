import { Controller, Delete, Get, Next, Post, Put, Request, Response } from "@decorators/express";
import { Authenticated, Guard } from "../Middlewares/AuthMiddleware";
import ProtototoRepository from "../Repository/ProtototoRepository";
import { RequestE } from "../Utilities/RequestE";
import {
	ProtototoMatch,
	ProtototoPredictions,
	ProtototoSeason,
	ProtototoResults,
	ProtototoPredictionsExternal
} from "smoelenboek-types";
import { Database } from "../Database";
import ResponseData from "../Utilities/ResponseData";
import { body, matchedData, param, query, validationResult } from "express-validator";
import exceljs from "exceljs";
import path from "path";

/* eslint-disable no-mixed-spaces-and-tabs */

type MatchPrediction = {
  match: ProtototoMatch,
  prediction?: ProtototoPredictions | ProtototoPredictionsExternal
}

interface Column {
  header: string,
  key: string,
  width?: number
}

@Controller("/protototo")
export default class ProtototoController {
	private protototoRepository = new ProtototoRepository();

  @Authenticated()
  @Get("/players")
	async getPlayers(@Request() req, @Response() res) {
		// TODO: Get players of a season
	}

  @Authenticated(false)
  @Get("/matches", [query("seasonId").toInt(), body(["firstName", "lastName", "email"])])
  async getMatches(@Request() req: RequestE, @Response() res, @Next() next) {
  	const data = matchedData(req);

  	let season: ProtototoSeason;

  	if (data.seasonId) {
  		season = await Database.manager.findOneBy(ProtototoSeason, { id: data.seasonId });
  	} else {
  		season = await this.protototoRepository.getCurrentSeason();
  	}

  	if (!season) {
  		next(new Error("There is no active season!"));
  		return;
  	}

  	const matches = await this.protototoRepository.getMatches(false, season.id);

  	const elements: MatchPrediction[] = [];

  	if (req.user) {
  		for (const match of matches) {
  			const prediction = await this.protototoRepository.getPrediction(req.user.id, match.id);
  			elements.push({ match: match, prediction });
  		}
  	} else {
  		for (const match of matches) {
  			const prediction = await this.protototoRepository.GetExternalPrediction(data.firstName, data.lastName, data.email, match.id);
  			elements.push({ match, prediction });
  		}
  	}

  	if (data.seasonId) {
  		// This returns all the matches from the selected season
  		res.json(ResponseData.build("OK", matches));
  		return;
  	}
  	// TODO: Add possibility to retrieve prediction for anonymous users

  	res.json(ResponseData.build("OK", elements));
  }

  @Authenticated(false)
  @Post("/bet")
  async bet(@Request() req: RequestE, @Response() res, @Next() next) {
  	const { setOne, setTwo, setThree, setFour, setFive } = req.body;

  	const { id } = req.query;

  	const match = await Database.manager.findOneBy(ProtototoMatch, { id: parseInt(id as string) });

  	if (!match) {
  		next(new Error(`Could not find match with id ${id}`));
  		return;
  	}

  	if (req.user) {
  		let prediction = await this.protototoRepository.getPrediction(req.user.id, match.id);

  		if (!prediction) {
  			prediction = new ProtototoPredictions();
  			prediction.user = req.user;
  			prediction.match = match;
  		}

  		prediction.setOne = setOne;
  		prediction.setTwo = setTwo;
  		prediction.setThree = setThree;
  		prediction.setFour = setFour;
  		prediction.setFive = setFive;

  		await Database.manager.save(prediction);
  	} else {
  		const { firstName, lastName, email } = req.body;

  		let bet = await this.protototoRepository.GetExternalPrediction(firstName, lastName, email, match.id);

  		if (!bet) {
  			bet = new ProtototoPredictionsExternal();
  			bet.firstName = firstName;
  			bet.lastName = lastName;
  			bet.email = email;
  			bet.match = match;
  		}

  		bet.setOne = setOne;
  		bet.setTwo = setTwo;
  		bet.setThree = setThree;
  		bet.setFour = setFour;
  		bet.setFive = setFive ?? null;
  		console.log(bet);

  		await Database.manager.save(bet);
  	}

  	res.json(ResponseData.build("OK", null, "Stored prediction!"));
  }

  @Authenticated()
  @Guard("protototo.edit")
  @Get("/seasons")
  async getSeasons(@Request() req, @Response() res) {
  	const seasons = await Database.manager.find(ProtototoSeason, { order: { id: "ASC" } });

  	res.json(ResponseData.build("OK", seasons));
  }

  @Authenticated()
  @Guard("protototo.edit")
  @Get("/season/:id", [param("id").toInt()])
  async getSeason(@Request() req, @Response() res, @Next() next) {
  	const { id } = matchedData(req);

  	const season = await Database.manager.findOneBy(ProtototoSeason, { id });

  	if (!season) {
  		next(new Error(`Could not find season with id ${req.params.id}`));
  	}

  	res.json(ResponseData.build("OK", season));
  }

  @Authenticated()
  @Guard("protototo.edit")
  @Post("/season", [body("start").exists().toDate(), body("end").exists().toDate(), body("tikkie").default("")])
  async postSeason(@Request() req, @Response() res, @Next() next) {
  	const errors = validationResult(req);

  	if (!errors.isEmpty()) {
  		next(new Error(errors.array()[0].msg));
  		return;
  	}

  	const { start, end, tikkie } = matchedData(req);

  	if (!(await this.seasonOverlap(start))) {
  		// TODO: Add which season / date it overlaps with
  		next(new Error("Start date overlaps with an another season!"));
  		return;
  	}

  	if (!(await this.seasonOverlap(end))) {
  		next(new Error("End date overlaps with an another season!"));
  		return;
  	}

  	const season = new ProtototoSeason();

  	season.start = start;
  	season.end = end;

  	if (tikkie) {
  		season.tikkie = tikkie;
  	}

  	await Database.manager.save(season);

  	res.json(ResponseData.build("OK", season, "Created season!"));
  }

  @Authenticated()
  @Guard("protototo.edit")
  @Put("/season/:id", [body("start").exists().toDate(), body("end").exists().toDate(), body("tikkie")])
  async updateSeason(@Request() req, @Response() res, @Next() next) {
  	const { id } = req.params;

  	const season = await Database.manager.findOneBy(ProtototoSeason, { id: parseInt(id) });

  	if (!season) {
  		next(new Error(`Could not find season with ${id}`));
  		return;
  	}

  	const { start, end, tikkie } = matchedData(req);

  	if (!(await this.seasonOverlap(start, season.id))) {
  		// TODO: Add which season / date it overlaps with
  		next(new Error("Start date overlaps with an another season!"));
  		return;
  	}

  	if (!(await this.seasonOverlap(end, season.id))) {
  		next(new Error("End date overlaps with an another season!"));
  		return;
  	}

  	season.start = start;
  	season.end = end;
  	season.tikkie = tikkie;

  	await Database.manager.save(season);

  	res.json(ResponseData.build("OK", season, "Updated season!"));
  }


  @Authenticated()
  @Guard("protototo.edit")
  @Delete("/season/:id")
  async deleteSeason(@Request() req, @Response() res) {
  	const { id } = req.params;

  	await Database.manager.delete(ProtototoSeason, { id: parseInt(id) });

  	res.json(ResponseData.build("OK", null, "Deleted Protototo season!"));
  }

  @Authenticated()
  @Guard("protototo.edit")
  @Get("/overlap/:date", [param("date").toDate(), query("id").default(0).toInt()])
  async getSeasonOverlap(@Request() req, @Response() res) {
  	const { date, id } = matchedData(req);
  	const result = await this.seasonOverlap(date, id);

  	res.json(ResponseData.build("OK", result));
  }

  private async seasonOverlap(date: Date, id?: number) {
  	const seasons = await Database.manager.createQueryBuilder(ProtototoSeason, "s")
  		.select(["s.id"])
  		.where(":date BETWEEN s.start AND s.end", { date })
  		.andWhere("s.id != :id", { id })
  		.getMany();
  	console.log(seasons, id);
  	let result = true;

  	if (seasons.length > 0) {
  		result = false;
  	}

  	return result;
  }

  @Authenticated()
  @Guard("protototo.edit")
  @Get("/match/:id", [param("id").toInt()])
  async getMatch(@Request() req, @Response() res, @Next() next) {
  	const { id } = matchedData(req);

  	const match = await Database.manager.findOneBy(ProtototoMatch, { id });

  	res.json(ResponseData.build("OK", match));
  }

  @Authenticated()
  @Guard("protototo.edit")
  @Post("/match", [body("playDate").exists().toDate(), body(["homeTeam", "awayTeam", "gender", "seasonId"]).exists()])
  async postMatch(@Request() req, @Response() res, @Next() next) {
  	const errors = validationResult(req);

  	if (!errors.isEmpty()) {
  		next(new Error(errors.array()[0].msg));
  		return;
  	}

  	const { playDate, homeTeam, awayTeam, gender, seasonId } = matchedData(req);

  	const season = await Database.manager.findOneBy(ProtototoSeason, { id: seasonId });

  	if (!season) {
  		next(new Error(`Could not find season with id ${seasonId}`));
  		return;
  	}

  	const match = new ProtototoMatch();

  	match.playDate = playDate;
  	match.homeTeam = homeTeam;
  	match.awayTeam = awayTeam;
  	match.location = "Don't care"; //TODO: Remove this field from the entity
  	match.gender = gender;
  	match.season = season;

  	await Database.manager.save(match);

  	res.json(ResponseData.build("OK", match, "Created match!"));
  }

  @Authenticated()
  @Guard("protototo.edit")
  @Put("/match/:id", [param("id").toInt(), body("playDate").exists().toDate(), body(["homeTeam", "awayTeam", "gender"]).exists()])
  async updateMatch(@Request() req, @Response() res, @Next() next) {
  	const errors = validationResult(req);

  	if (!errors.isEmpty()) {
  		next(new Error(errors.array()[0].msg));
  		return;
  	}

  	const { id, playDate, homeTeam, awayTeam, gender } = matchedData(req);

  	const match = await Database.manager.findOneBy(ProtototoMatch, { id });

  	if (!match) {
  		next(new Error(`Could not find match with id ${id}`));
  		return;
  	}

  	console.log(playDate);

  	match.playDate = playDate;
  	match.homeTeam = homeTeam;
  	match.awayTeam = awayTeam;
  	match.gender = gender;

  	await Database.manager.save(match);

  	res.json(ResponseData.build("OK", match, "Updated match!"));
  }

  @Authenticated()
  @Guard("protototo.edit")
  @Post("/match/:id")
  async postResult(@Request() req, @Response() res, @Next() next) {
  	const { setOne, setTwo, setThree, setFour, setFive } = req.body;

  	const { id } = req.params;

  	const match = await Database.manager.findOneBy(ProtototoMatch, { id: parseInt(id) });

  	if (!match) {
  		next(new Error(`Match does not exist with id ${id}`));
  		return;
  	}

  	let result = await Database.manager.findOneBy(ProtototoResults, { match: match });

  	if (!result) {
  		result = new ProtototoResults();
  		result.match = match;
  	}

  	result.setOne = setOne;
  	result.setTwo = setTwo;
  	result.setThree = setThree;
  	result.setFour = setFour;
  	result.setFive = setFive;

  	await Database.manager.save(result);

  	res.json(ResponseData.build("OK", result, "Saved result!"));
  }

  @Authenticated()
  @Guard("protototo.edit")
  @Delete("/match/:id")
  async deleteMatch(@Request() req, @Response() res, @Next() next) {
  	const { id } = req.params;

  	await Database.manager.delete(ProtototoMatch, { id: parseInt(id) });

  	res.json(ResponseData.build("OK", null, "Deleted match!"));
  }

  @Get("/external/season")
  async getSeasonExternal(@Request() req, @Response() res) {
  	const result = await this.protototoRepository.getCurrentSeason();

  	res.json(ResponseData.build("OK", result));
  }

  @Authenticated()
  @Guard("protototo.edit")
  @Get("/export/players/:id", [param("id").exists().toInt()])
  async getExportPlayers(@Request() req, @Response() res, @Next() next) {
  	const errors = validationResult(req);

  	if (!errors.isEmpty()) {
  		next(new Error(errors.array()[0].msg));
  		return;
  	}

  	const { id } = matchedData(req);

  	const predictions = await this.protototoRepository.GetPlayersForSeason(id);

  	const columns: Column[] = [{ header: "Naam", key: "name" }, { header: "Score", key: "score" }, { header: "Email", key: "email" }];

  	const workbook = new exceljs.Workbook();

  	workbook.creator = "Fabio Dijkshoorn";

  	const worksheet = workbook.addWorksheet("Scores");

  	worksheet.columns = columns;

  	for (const prediction of predictions) {
  		worksheet.addRow({ name: prediction.name, score: prediction.score, email: prediction.email });
  	}

  	const location = path.join(__dirname, "../../public/temp/protototo_results.xlsx");

  	await workbook.xlsx.writeFile(location);

  	res.sendFile(location);

  }
}
