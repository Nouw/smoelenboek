import { attachMiddleware } from "@decorators/express";
import { PermissionName, Permissions, Role, Roles, User } from "smoelenboek-types";
import { RequestE, RequestWithAnonymous } from "../Utilities/RequestE";
import { RolesHierarchy } from "smoelenboek-types";
import { isEmail } from "../Utilities/Middleware";
import passport from "passport";
import { asyncJwtAuthentication } from "../Services/AuthService";

/**
 * @param fail set to false if no error should be thrown
 * @constructor
 */
export function Authenticated(fail = true) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    attachMiddleware(target, propertyKey, passport.authenticate("jwt", { session: false }));
  };
}

export function Guard(requiredPermission: PermissionName) {
  return function(
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

export function AuthenticatedAnonymous(fail = true) {
  return function(
    target: any,
    propertyKey: string,
  ) {
    attachMiddleware(target, propertyKey, async (req: RequestWithAnonymous, res, next) => {
      const token = req.headers.authorization;

      if (!fail && !token) {
        next();
        return;
      }

      if (isEmail(token)) {
        req.email = token;
      } else {
        req.user = await asyncJwtAuthentication(req, res);
      }

      next();
    });
  };
}

export function IsAdmin(user: User): boolean {
  if (!user.roles) {
    return false;
  }

  for (const role of user.roles) {
    if (role.role === Roles.ADMIN) {
      return true;
    }
  }

  return false;
}

export function isBoard(user: User): boolean {
  if (!user.roles) {
    return false;
  }

  for (const role of user.roles) {
    if (role.role === Roles.BOARD) {
      return true;
    }
  }

  return false;
}
