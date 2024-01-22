import { attachMiddleware } from "@decorators/express";
import AuthService from "../Services/AuthService";
import { Database } from "../Database";
import { PermissionName, Permissions, Role, Roles, User } from "smoelenboek-types";
import { RequestE, RequestWithAnonymous } from "../Utilities/RequestE";
import { RolesHierarchy } from "smoelenboek-types";
import { NextFunction } from "express";
import { isEmail } from "../Utilities/Middleware";
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
			req.user = await authenticateUser(req.headers.authorization, next, fail);
			next();
		});
	};
}

export function Guard(requiredPermission: PermissionName) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		attachMiddleware(target, propertyKey, (req: RequestE, res, next) => {
			const requiredRole = Permissions[requiredPermission];
			// Get the child roles and add the role this user has
			const userRoles: Set<Roles> = new Set<Roles>();

			for (const role of req.user.roles) {
				userRoles.add(role.role);

				RolesHierarchy.get(role.role).forEach((childRole: Roles) => userRoles.add(childRole));
			}

			if (userRoles.has(requiredRole)) {
				next();
			} else {
				next(new Error("User does not have required permissions!"));
			}
		});
	};
}

export function AuthenticatedAnonymous(fail = true)  {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		attachMiddleware(target, propertyKey, async (req: RequestWithAnonymous, res, next) => {
			const token = req.headers.authorization;

			if (isEmail(token)) {
				req.email = token;
			} else {
				const user = await authenticateUser(token, next, fail);
				req.user = user;
			}

			next();
		});
	};
}

async function authenticateUser(authToken: string, next: NextFunction, fail = true): Promise<User> {
	const authService = new AuthService();

	if (!authToken) {
		if (!fail) {
			next();
			return;
		}

		next(new Error("No auth token provider!"));
		return;
	}

	try {
		const decodedToken = authService.decodeToken(authToken);

		if (Date.now() >= decodedToken.exp * 1000) {
			next(new Error("Auth token has expired!"));
			return;
		}

		const user = await Database
			.createQueryBuilder(User, "u")
			.leftJoinAndSelect("u.roles", "r")
			.where("u.id = :id", { id: decodedToken.id })
			.andWhere("u.email = :email", { email: decodedToken.email })
			.getOne();

		if (!user && fail) {
			next(new Error("User not found!"));
			return;
		}

		return user;
	} catch (e) {
		console.error(e);

		next(e);
	}
}

export function IsAdmin(user: User) {
	if (!user.roles) {
		return false;
	}

	for (const role of user.roles) {
		if (role.name === Roles.ADMIN) {
			return true;
		}
	}

	return false;
}
