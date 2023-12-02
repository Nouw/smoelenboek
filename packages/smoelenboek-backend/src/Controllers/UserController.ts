import { Controller, Get, Request, Response, Next, Delete, Put, Post } from "@decorators/express";
import { Authenticated, Guard } from "../Middlewares/AuthMiddleware";
import { body, matchedData, param, validationResult } from "express-validator";
import { Database } from "../Database";
import { User, Role } from "smoelenboek-types";
import ResponseData from "../Utilities/ResponseData";
import { RequestE } from "../Utilities/RequestE";
import { IsNull } from "typeorm";
import moment from "moment";
import UserService from "../Services/UserService";
import Mail from "../Utilities/Mail";
import multer from "multer";
import Oracle from "../Utilities/Oracle";

const oracleUpload = multer({ storage: multer.memoryStorage() });

@Controller("/user")
export default class UserController {
	private userService = new UserService();
	private oracle = new Oracle();

	@Authenticated() //TODO: Should be a better way to do this query
	@Get("/profile/:id", [param("id").toInt()])
	async getProfile(@Request() req: RequestE, @Response() res, @Next() next) {
		const { id } = matchedData(req);

		const user = await Database.createQueryBuilder(User, "u")
			.leftJoinAndSelect("u.userTeamSeason", "userTeam")
			.leftJoinAndSelect("userTeam.team", "team")
			.leftJoinAndSelect("userTeam.season", "userTeamSeason")
			.leftJoinAndSelect("u.userCommitteeSeason", "userCommittee")
			.leftJoinAndSelect("userCommittee.committee", "committee")
			.leftJoinAndSelect("userCommittee.season", "userCommitteeSeason")
			.addOrderBy("userTeamSeason.id", "DESC")
			.addOrderBy("userCommitteeSeason.id", "DESC")
			.where("u.id = :id", { id })
			.getOne();

		if (!user) {
			next(new Error("User not found!"));
			return;
		}

		//Remove password from user object
		user.password = undefined;

		const teams = user.userTeamSeason;
		const committees = user.userCommitteeSeason;
		//This is the formatted user, so we can easily access the data on the frontend
		const formattedUser: any = user;
		formattedUser.seasons = {};

		teams.forEach((team) => {
			const seasons = Object.keys(formattedUser.seasons);
			const teamSeason = team.season.id;
			//Check if season already exists, if not create it otherwise append to it.
			if (seasons.includes(teamSeason.toString())) {
				//Remove the season because it's redundant
				team.season = undefined;
				formattedUser.seasons[teamSeason].data.push(team);
			} else {
				const seasonName = team.season.name;
				team.season = undefined;
				formattedUser.seasons[teamSeason] = {
					name: seasonName,
					data: [team],
				};
			}
		});

		committees.forEach((committee) => {
			const seasons = Object.keys(formattedUser.seasons);
			const committeeSeason = committee.season.id;
			//Check if season exists, if not create it otherwise append data to it
			if (seasons.includes(committeeSeason.toString())) {
				committee.season = undefined;
				formattedUser.seasons[committeeSeason].data.push(committee);
			} else {
				committee.season = undefined;
				formattedUser.seasons[committeeSeason] = {
					data: [committee],
				};
			}
		});

		formattedUser.userCommitteeSeason = undefined;
		formattedUser.userTeamSeason = undefined;

		const seasons = formattedUser.seasons;
		const keys = Object.keys(seasons);
		keys.sort(function (a, b) {
			return parseInt(b) - parseInt(a);
		});

		const newSeasons = {};

		keys.forEach((season) => {
			newSeasons[season] = seasons[season];
		});


		formattedUser.seasons = seasons;

		let hasRole = false;

		req.user.roles.forEach((role: Role) => {
			if (role.id === 2 && !hasRole) {
				hasRole = true;
			}
		});

		if (id !== req.user.id && !hasRole) {
			user.bankaccountNumber = undefined;
		}


		res.json(ResponseData.build("OK", formattedUser));
	}

	@Get("/list")
	@Authenticated()
	@Guard("user.edit")
	async getUsers(@Response() res) {
		const users = await Database.manager.findBy(User, { leaveDate: IsNull() });

		res.json(ResponseData.build("OK", users));
	}

	@Delete("/:id")
	@Authenticated()
	@Guard("user.edit")
	async deleteUser(@Request() req, @Response() res, @Next() next) {
		const { id } = req.params;

		const user = await Database.manager.findOneBy(User, { id });

		if (!user) {
			next(new Error("User not found!"));
			return;
		}

		user.leaveDate = new Date();

		await Database.manager.save(user);

		res.json(ResponseData.build("OK", null, "Removed user!"));
	}

	@Get("/info/:id")
	@Authenticated()
	@Guard("user.edit")
	async getUser(@Request() req, @Response() res, @Next() next) {
		const { id  } = req.params;

		const user = await Database.manager.findOneBy(User, { id });

		if (!user) {
			next(new Error("User not found!"));
			return;
		}

		res.json(ResponseData.build("OK", user));
	}

	@Put("/:id")
	@Authenticated()
	async updateUser(@Request() req, @Response() res, @Next() next) {
		const { id } = req.params;
		const admin  = req.query.admin.toString().toLowerCase() === "true";

		const user = await Database.manager.findOneBy(User, { id });

		const {
			firstName,
			lastName,
			streetName,
			houseNumber,
			postcode,
			city,
			email,
			phoneNumber,
			bankaccountNumber,
			backNumber,
			birthDate,
		} = req.body;

		if (admin) {
			if (user.firstName !== firstName) {
				user.firstName = firstName;
			}

			if (user.lastName !== lastName) {
				user.lastName = lastName;
			}
		}

		if (user.streetName !== streetName) {
			user.streetName = streetName;
		}

		if (user.houseNumber !== houseNumber) {
			user.houseNumber = houseNumber;
		}

		if (user.postcode !== postcode) {
			user.postcode = postcode;
		}

		if (user.city !== city) {
			user.city = city;
		}

		if (user.email !== email) {
			user.email = email;
		}

		if (user.phoneNumber !== phoneNumber) {
			user.phoneNumber = phoneNumber;
		}

		if (user.bankaccountNumber !== bankaccountNumber) {
			user.bankaccountNumber = bankaccountNumber;
		}

		if (user.backNumber !== backNumber) {
			user.backNumber = backNumber;
		}

		if (moment(user.birthDate).isSame(moment(birthDate))) {
			user.birthDate = moment(birthDate).toDate();
		}

		await Database.manager.save(user, { listeners: !admin });

		res.json(ResponseData.build("OK", user, "Updated information!"));
		return;
	}

	@Authenticated()
	@Guard("user.edit")
	@Post("/", [
		body("firstName").exists(),
		body("lastName").exists(),
		body("email").exists().isEmail(),
		body("streetName").exists(),
		body("houseNumber").exists(),
		body("postcode").exists(),
		body("city").exists(),
		body("phoneNumber").exists(),
		body("birthDate").toDate(),
		body("bodyNumber"),
	])
	async createUser(@Request() req, @Response() res, @Next() next) {
		const errors = validationResult(req); //TODO: turn this into a decorator

		if (!errors.isEmpty()) {
			next(new Error(errors.array()[0].msg));
			return;
		}

		const {
			firstName,
			lastName,
			streetName,
			houseNumber,
			postcode,
			city,
			email,
			phoneNumber,
			bankaccountNumber,
			backNumber,
			birthDate,
			bondNumber
		} = matchedData(req);

		const user = new User();

		const password = this.userService.generatePassword();

		user.firstName = firstName;
		user.lastName = lastName;
		user.password = password;
		user.streetName = streetName;
		user.houseNumber = houseNumber;
		user.postcode = postcode;
		user.city = city;
		user.email = email;
		user.phoneNumber = phoneNumber;
		user.bankaccountNumber = bankaccountNumber ?? "-";
		user.backNumber = backNumber;
		user.birthDate = birthDate;
		user.bondNumber = bondNumber ?? "-";

		try {
			await Database.manager.save(user);
		} catch (e) {
			next(e);
			return;
		}

		const mail = new Mail("USV Protos Smoelenboek account", user.email);

		await mail.addGreeting(`Beste ${user.firstName} ${user.lastName}`)
			.addIntro([
				"Je bent zojuist toegevoegd als lid van USV Protos in het online leden bestand. Hierbij ontvang je de inloggevens waarmee je kan inloggen op het Smoelenboek.",
				"Je kan op het Smoelenboek ook je wachtwoord veranderen.",
				`Gebruikersnaam: ${user.email}`,
				`Wachtwoord: ${password}`
			]).addAction({
				instructions: "Klik de knop hieronder om naar het smoelenboek te gaan",
				button: {
					color: "#d0211c",
					text: "Smoelenboek openen",
					link: "https://smoelenboek.usvprotos.nl"
				}
			}).send();

		res.json(ResponseData.build("OK", user, "Saved user!"));
	}

	@Get("/search")
	@Authenticated()
	async searchUser(@Request() req, @Response() res) {
		const { name } = req.query;

		const users = await Database.manager.createQueryBuilder(User, "u")
			.select(["u.id", "u.firstName", "u.lastName"])
			.where("CONCAT(u.firstName, ' ', u.lastName) LIKE :name", {
				name: `%${name}%`,
			})
			.andWhere("u.leaveDate IS NULL")
			.getMany();

		res.json(ResponseData.build("OK", users));
	}

	@Authenticated()
	@Get("/info/:id")
	async getUserInformation(@Request() req: RequestE, @Response() res) {
		res.json(ResponseData.build("OK", req.user));
	}

	@Authenticated()
	@Post("/picture", [oracleUpload.single("profilePicture")])
	async postProfilePicture(@Request() req: RequestE, @Response() res) {
		const file = req.file;

		const user: User = req.user;

		const fileName = await this.oracle.upload(file, "user");

		user.profilePicture = `user/${fileName}`;

		await Database.manager.save(user, { listeners: false });

		res.json(ResponseData.build("OK", user.profilePicture));
	}

	@Authenticated()
	@Get("/picture")
	async getProfilePicture(@Request() req: RequestE, @Response() res) {
		res.json(ResponseData.build("OK", req.user.profilePicture));
	}
}

