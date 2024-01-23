import { attachMiddleware } from "@decorators/express";
import AuthService from "../Services/AuthService";
import { Database } from "../Database";
import { User } from "smoelenboek-types";
import { RequestE } from "../Utilities/RequestE";
import { User } from "smoelenboek-types";

/**
 * @param fail set to false if no error should be thrown
 * @constructor
 */
export function Authenticated(fail = true) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		attachMiddleware(target, propertyKey, async (req: RequestE, res, next) => {
			const authService = new AuthService();

			const authToken = req.headers.authorization;

			if (!authToken) {
				if (!fail) {
					return next();
				}

				return next(new Error("No auth token provider!"));
			}

			try {
				const decodedToken = authService.decodeToken(authToken);

				if (Date.now() >= decodedToken.exp * 1000) {
					return next(new Error("Auth token has expired!"));
				}

				const user = await Database
					.createQueryBuilder(User, "u")
					.innerJoinAndSelect("u.roles", "r")
					.innerJoinAndSelect("r.permissions", "p")
					.where("u.id = :id", { id: decodedToken.id })
					.andWhere("u.email = :email", { email: decodedToken.email })
					.getOne();

				if (!user && fail) {
					return next(new Error("User not found!"));
				}

				req.user = user;

				return next();
			} catch (e) {
				console.error(e);

				next(e);
			}
		});
	};
}

export function Guard(requiredPermissions: string[]) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		attachMiddleware(target, propertyKey, (req: RequestE, res, next) => {
			let permissions = [];

			for (const role of req.user.roles) {
				const names = role.permissions.map((permission) => permission.name);

				if (names.includes("ALL")) {
					next();
					return;
				}

				permissions = [...permissions, ...names];
			}

			if (requiredPermissions.every((val) => permissions.includes(val))) {
				next();
			} else {
				next(new Error("User does not have required permissions!"));
			}
		});
	};
}

export function IsAdmin(user: User) {
	if (!user.roles) {
		return false;
	}

	for (const role of user.roles) {
		const names = role.permissions.map((permission) => permission.name);

		if (names.includes("ALL") || role.name === "ADMIN") {
			return true;
		}
	}

	return false;
}
