import { Controller, Post, Request, Response, Get, Next } from "@decorators/express";
import UserService from "../Services/UserService";
import AuthService from "../Services/AuthService";
import ResponseData from "../Utilities/ResponseData";
import { RequestE } from "../Utilities/RequestE";
import { Authenticated } from "../Middlewares/AuthMiddleware";
import { Database } from "../Database";
import { Role, User } from "smoelenboek-types";
import bcrypt from "bcrypt";
import { body, matchedData, validationResult } from "express-validator";

@Controller("/auth")
export default class AuthController {
	private userService: UserService = new UserService();
	private authService: AuthService = new AuthService();

	@Post("/login")
	async login(@Request() req, @Response() res) {
		const { email, password } = req.body;

		const user = await this.userService.checkPassword(email, password);

		const { authToken, refreshToken } = this.authService.getTokens(user);

		res.json(ResponseData.build("OK", {
			id: user.id,
			accessToken: authToken,
			refreshToken,
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

		const user = await Database.manager.findOne(User, { select: { id: true, password: true }, where: { id : req.user.id } });

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

	@Authenticated()
	@Get("/test")
	async test(@Request() req: RequestE, @Response() res) {
		res.send("Authenticated!");
	}
}
