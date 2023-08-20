import {Role} from "smoelenboek-types";

export function checkForPermission(roles: Role[], name: string): boolean {
  for (const role of roles) {
    for (const permission of role.permissions) {
      if (permission.name === name || permission.name === "ALL") {
        return true;
      }
    }
  }

  return false;
}

export function isAdmin(roles: Role[]): boolean {
  for (const role of roles) {
    if (role.name === "Admin") {
      return true;
    }
  }

  return false;
}
