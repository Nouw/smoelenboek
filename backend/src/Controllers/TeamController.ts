import { Controller, Delete, Get, Next, Post, Put, Request, Response } from "@decorators/express";
import { body, matchedData, param, query, validationResult } from "express-validator";
import { Team, Gender, TeamFunction, UserTeamSeason, Season, User } from "smoelenboek-types";
import { Database } from "../Database";
import ResponseData from "../Utilities/ResponseData";
import SeasonRepository from "../Repository/SeasonRepository";
import { Authenticated, Guard } from "../Middlewares/AuthMiddleware";

@Controller("/team")
export default class TeamController {
	private seasonRepository = new SeasonRepository();

	@Get("/", [query("type").customSanitizer(TeamController.typeSanitizer)])
	async getTeams(@Request() req, @Response() res) {
		const data = matchedData(req);

		let teams: Team[];

		if (data.type !== "all") {
			teams = await Database.manager.findBy(Team, { gender: data.type });
		} else {
			teams = await Database.manager.find(Team);
		}

		res.json(ResponseData.build("OK", teams));
	}

	// TODO: This is garbage, make it into one query!
	@Get("/info/:id", [param("id").toInt()])
	async getTeam(@Request() req, @Response() res) {
		const { id } = matchedData(req);

		const season = await this.seasonRepository.getCurrentSeason();

		const players = await Database.createQueryBuilder(UserTeamSeason, "userTeam")
			.select([
				"userTeam",
				"user.id",
				"user.firstName",
				"user.lastName",
				"user.profilePicture",
				"team.name",
				"team.rank",
				"team.gender",
				"team.image",
			])
			.innerJoin("userTeam.user", "user")
			.innerJoin("userTeam.team", "team")
			.where("userTeam.team.id = :teamId", { teamId: id })
			.andWhere("userTeam.season.id = :season", {
				season: season.id,
			})
			.getMany();

		const team = await Database.manager.findOneBy(Team, { id });

		res.json(ResponseData.build("OK", {
			players,
			teamInfo: team
		}));
	}

	@Authenticated()
	@Guard(["CREATE_TEAM"])
	@Post("/", [body(["name", "rank"]).exists(), body("gender").exists().customSanitizer(TeamController.typeSanitizer)])
	async createTeam(@Request() req, @Response() res, @Next() next) {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			next(new Error(errors.array()[0].msg));
			return;
		}

		const { name, rank, gender } = matchedData(req);

		if (gender === "all") {
			next(new Error("Gender type does not exist!")); // Pretty based
			return;
		}

		const duplicate = await Database.manager.findBy(Team, { name });

		if (duplicate.length >= 1) {
			next(new Error("A team already exists with that name!"));
			return;
		}

		const team = new Team();

		team.name = name;
		team.rank = rank;
		team.gender = gender;

		await Database.manager.save(team);

		res.json(ResponseData.build("OK", team, "Created team!"));
	}

	@Authenticated()
	@Guard(["CREATE_TEAM"])
	@Put("/:id", [param("id").toInt(), body(["name", "rank"]).exists(), body("gender").exists().customSanitizer(TeamController.typeSanitizer)])
	async updateTeam(@Request() req, @Response() res, @Next() next) {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			next(new Error(errors.array()[0].msg));
			return;
		}

		const { id, name, rank, gender } = matchedData(req);

		if (gender === "all") {
			next(new Error("Gender type does not exist!")); // Pretty based
			return;
		}

		const duplicate = await Database.manager.findBy(Team, { name });

		if (duplicate.length >= 1) {
			next(new Error("A team already exists with that name!"));
			return;
		}

		const team = await Database.manager.findOneBy(Team, { id });

		if (!team) {
			next(new Error(`Could not find team with id ${id}`));
			return;
		}

		team.name = name;
		team.rank = rank;
		team.gender = gender;

		await Database.manager.save(team);

		res.json(ResponseData.build("OK", team, "Updated team!"));
	}

	@Authenticated()
	@Guard([])
	@Delete("/:id", [param("id").toInt()])
	async deleteTeam(@Request() req, @Response() res) {
		const { id } = matchedData(req);

		await Database.manager.delete(Season, { id });

		res.json(ResponseData.build("OK", null, "Deleted team!"));
	}

	@Authenticated()
	@Guard(["UPDATE_TEAM"])
	@Post("/player/:id", [param("id").toInt(), body("userId").exists()])
	async addPlayer(@Request() req, @Response() res, @Next() next) {
		const { id } = matchedData(req);

		const { userId } = req.body;

		const user = await Database.manager.findOneBy(User, { id: userId });

		if (!user) {
			next(new Error("Could not find user!"));
			return;
		}

		const team = await Database.manager.findOneBy(Team, { id });

		if (!team) {
			next(new Error("Could not find team!"));
			return;
		}

		const userTeamSeason = new UserTeamSeason();

		userTeamSeason.user = user;
		userTeamSeason.team = team;
		userTeamSeason.season = await this.seasonRepository.getCurrentSeason();
		userTeamSeason.function = TeamFunction.Middle;

		await Database.manager.save(userTeamSeason);

		res.json(ResponseData.build("OK", userTeamSeason));
	}

	@Authenticated()
	@Guard(["UPDATE_TEAM"])
	@Delete("/player/:id", [param("id").toInt()])
	async deletePlayer(@Request() req, @Response() res) {
		const { id } = matchedData(req);

		await Database.manager.delete(UserTeamSeason, { id });

		res.json(ResponseData.build("OK", null, "Deleted player from team!"));
	}

	@Authenticated()
	@Guard(["UPDATE_TEAM"])
	@Put("/player/:id", [param("id").toInt(), body("role").exists()])
	async updatePlayer(@Request() req, @Response() res) {
		const { id, role } = matchedData(req);

		const userTeamSeason = await Database.manager.findOneBy(UserTeamSeason, { id });

		userTeamSeason.function = role;

		await Database.manager.save(userTeamSeason);

		res.json(ResponseData.build("OK", userTeamSeason, "Updated user!"));
	}

	private static typeSanitizer(value: string) {
		switch (value) {
		case "male":
			return Gender.Male;
		case "female":
			return Gender.Female;
		default:
			return "all";
		}
	}
}
