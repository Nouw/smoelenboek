import { Roles } from "./Roles";

export const Permissions = {
  "team.view": Roles.USER,
  "team.edit": Roles.BOARD,
  "committee.view": Roles.USER,
  "committee.edit": Roles.BOARD,
  "protototo.view": Roles.ANONYMOUS,
  "protototo.edit": Roles.BOARD,
  "documents.view": Roles.USER,
  "documents.edit": Roles.BOARD,
  "dashboard.view": Roles.BOARD,
  "activity.view": Roles.ANONYMOUS,
  "activity.signup": Roles.USER,
  "activity.edit": Roles.BOARD,
  "season.edit": Roles.BOARD,
  "user.edit": Roles.BOARD,
};

export type PermissionName = keyof typeof Permissions;
