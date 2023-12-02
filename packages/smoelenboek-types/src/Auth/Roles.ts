export enum Roles {
  ADMIN = "ADMIN",
  BOARD = "BOARD",
  USER = "USER",
  ANONYMOUS = "ANONYMOUS",
}

// The key is the parent, the value is the children of the role.
// This means that the parent gets all permissions of the children
export const RolesHierarchy: Map<Roles, Roles[]> = new Map([
  [Roles.ADMIN, [Roles.BOARD, Roles.USER, Roles.ANONYMOUS]],
  [Roles.BOARD, [Roles.USER]],
  [Roles.USER, [Roles.ANONYMOUS]],
  [Roles.ANONYMOUS, []],
]);
