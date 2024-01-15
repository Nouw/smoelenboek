import { Controller, Post, Request, Response, Get, Next } from "@decorators/express";
import UserService from "../Services/UserService";
import AuthService from "../Services/AuthService";
import ResponseData from "../Utilities/ResponseData";
import { RequestE } from "../Utilities/RequestE";
import { Authenticated } from "../Middlewares/AuthMiddleware";
import { Database } from "../Database";
import { Role, Roles, User } from "smoelenboek-types";
import bcrypt from "bcrypt";
import { body, matchedData, validationResult } from "express-validator";
import Mail from "../Utilities/Mail";

@Controller("/auth")
export default class AuthController {
	private userService: UserService = new UserService();
	private authService: AuthService = new AuthService();

	@Post("/login")
	async login(@Request() req, @Response() res) {
		const { email, password } = req.body;

		const user = await this.userService.checkPassword(email, password);

		const { authToken, refreshToken } = this.authService.getTokens(user);
		const roles = await this.authService.getRoles(user);

		res.json(ResponseData.build("OK", {
			id: user.id,
			accessToken: authToken,
			refreshToken,
			roles: roles.map((role: Role) => role.role),
		}));
	}

	@Authenticated()
	@Get("/permissions")
	async getPermissions(@Request() req: RequestE, @Response() res) {
		const user = req.user;

		res.json(ResponseData.build("OK", { roles: user.roles }));
	}

	@Authenticated()
	@Post("/password/change", [body(["currentPassword", "newPassword"]).exists()])
	async changePassword(@Request() req: RequestE, @Response() res, @Next() next) {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			next(new Error(errors.array()[0].msg));
			return;
		}

		const { currentPassword, newPassword } = matchedData(req);

		const user: Partial<User> = await Database.manager.findOne(User, { select: { id: true, password: true }, where: { id : req.user.id } });

		const match = await bcrypt.compare(currentPassword, user.password);

		if (!match) {
			next(new Error("Passwords do not match!"));
			return;
		}

		user.password = await bcrypt.hash(newPassword, 10);
		// Do not trigger listener because it is a password update
		await Database.manager.save(user, { listeners: false });

		res.json(ResponseData.build("OK", "Updated password!"));
	}

  @Post("/password/reset", [body("email").exists().isEmail()])
	async resetPassword(@Request() req, @Response() res, @Next() next) {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			console.error(errors);
			return next(ResponseData.build("FAILED", "Email was not provided!"));
		}

		const { email } = matchedData(req);

		const user: Partial<User> = await Database.manager.findOneBy(User, { email });

		if (user) {
			const newPassword = this.userService.generatePassword();
			user.password = await bcrypt.hash(newPassword, 10);

			await Database.manager.save(user);

			const mail = new Mail("USV Protos Smoelenboek Wachtwoord reset", user.email);

			await mail.addGreeting(`Beste ${user.firstName} ${user.lastName}`)
				.addIntro([
					"Er is zojuist een aanvraag gedaan om je wachtwoord te veranderen. Hieronder vind je het nieuwe wachtwoord:",
					" ",
					`Wachtwoord: ${newPassword}`
				]).addAction({
					instructions: "Klik de knop hieronder om naar de inlog pagina te gaan",
					button: {
						color: "#d0211c",
						text: "Smoelenboek openen",
						link: "https://smoelenboek.usvprotos.nl"
					}
				}).send();

			res.json(ResponseData.build("OK", { message: "Email has been sent!" }));
			return;
		}

		res.json(ResponseData.build("OK", {}));
	}

	@Post("/role/add", [body("userId").isNumeric()])
  async addRoleToUser(@Request() req, @Response() res) {
  	const { userId } = matchedData(req);

  	const user = await Database.manager.findOneBy(User, { id: userId });
  	const role = new Role();
  	role.role = Roles.ADMIN;
  	// @ts-ignore
  	role.user = user;

  	await Database.manager.save(role);
  	res.json("Added role!");
  }
}
