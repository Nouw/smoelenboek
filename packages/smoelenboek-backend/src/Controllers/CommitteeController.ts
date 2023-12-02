import { RequestE } from "../Utilities/RequestE";
import { Request, Response, Next, Get, Controller, Post, Put, Delete } from "@decorators/express";
import { Authenticated, Guard } from "../Middlewares/AuthMiddleware";
import CommitteeRepository from "../Repository/CommitteeRepository";
import ResponseData from "../Utilities/ResponseData";
import { body, matchedData, param, validationResult } from "express-validator";
import { Committee, UserCommitteeSeason } from "smoelenboek-types";
import { Database } from "../Database";
import { NextFunction } from "express";
import UserRepository from "../Repository/UserRepository";
import SeasonRepository from "../Repository/SeasonRepository";

@Controller("/committee")
export default class CommitteeController {
	private committeeRepository = new CommitteeRepository();
	private userRepository = new UserRepository();
	private seasonRepository = new SeasonRepository();

	@Get("/", [])
	async get(@Request() req: RequestE, @Response() res) {
		const committees = await this.committeeRepository.all();

		res.json(ResponseData.build("OK", committees));
	}

	@Authenticated()
	@Guard("committee.edit")
	@Post("/", [body("name")])
	async post(@Request() req: RequestE, @Response() res, @Next() next) {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			next(new Error("Name is required!"));
			return;
		}

		const { name, email } = req.body;

		const committee = new Committee();

		committee.name = name;

		if (email) {
			committee.email = email;
		}

		await Database.manager.save(committee);

		res.json(ResponseData.build("OK", committee, `Created ${name}`));
	}
	@Authenticated()
	@Guard("committee.edit")
	@Put("/:id")
	// TODO: Add updating of committee image
	async put(@Request() req: RequestE, @Response() res, @Next() next) {
		const id = req.params.id;

		const committee = await Database.manager.findOne(Committee,
			{
				where: {
					id: parseInt(id)
				}
			});

		if (!committee) {
			next(new Error(`Could not find committee with id: ${id}`));
			return;
		}

		const { name, email, active } = req.body;

		if (name) {
			committee.name = name;
		}

		if (email) {
			committee.email = email;
		}

		if (active) {
			committee.active = active;
		}

		await Database.manager.save(committee);

		res.json(ResponseData.build("OK", null, `Updated ${committee.name}`));
	}

	@Authenticated()
	@Guard("committee.edit")
	@Delete("/:id")
	async delete(@Request() req: RequestE, @Response() res) {
		const id = req.params.id;

		await Database.manager.delete(Committee, id);

		res.json(ResponseData.build("OK", null, "Deleted committee"));
	}

	@Get("/:id", [param("id").toInt()])
	async info(@Request() req: RequestE, @Response() res) {
		const { id } = matchedData(req);

		const members = await this.committeeRepository.info(id);
		const committee = await Database.manager.findOneBy(Committee, { id });

		res.json(ResponseData.build("OK", { committee, members }, "Received committee"));
	}

	@Authenticated()
	@Guard("committee.edit")
	@Post("/user/:id", [body("userId").exists().toInt(), param("id").exists().toInt()])
	async addUser(@Request() req: RequestE, @Response() res, @Next() next: NextFunction) {
		const { userId, id } = matchedData(req);

		const user = await this.userRepository.getUserById(userId);

		if (!user) {
			return next(new Error(`Could not find user with id: ${userId}`));
		}

		const committee = await this.committeeRepository.getCommitteeById(id);

		if (!committee) {
			return next(new Error(`Could not find committee with id: ${id}`));
		}
		// TODO: Check if this does allow adding duplicate users to a committee
		const userCommitteeSeason = new UserCommitteeSeason();

		userCommitteeSeason.user = user;
		userCommitteeSeason.committee = committee;
		userCommitteeSeason.function = "Commissielid";
		userCommitteeSeason.season = await this.seasonRepository.getCurrentSeason();

		await Database.manager.save(userCommitteeSeason);

		res.json(ResponseData.build("OK", userCommitteeSeason));
	}

	@Authenticated()
	@Guard("committee.edit")
	@Delete("/user/:id", [param("id").exists().toInt()])
	async deleteUser(@Request() req: RequestE, @Response() res) {
		const { id } = matchedData(req);

		await Database.manager.delete(UserCommitteeSeason, id);

		res.json(ResponseData.build("OK", null, "Succesfully delete user from committee"));
	}

	@Authenticated()
	@Guard("committee.edit")
	@Put("/user/:id", [param("id").toInt(), body("role").exists()])
	async updateUser(@Request() req: RequestE, @Response() res, @Next() next) {
		const { id, role } = matchedData(req);

		const userCommittee = await Database.manager.findOneBy(UserCommitteeSeason, { id: parseInt(id) });

		if (!userCommittee) {
			return next(new Error("User is not in committee!"));
		}

		if (!role) {
			return next(new Error("Function unknown"));
		}

		userCommittee.function = role;

		await Database.manager.save(userCommittee);

		res.json(ResponseData.build("OK", userCommittee, "Successfully updated user!"));
	}
}

