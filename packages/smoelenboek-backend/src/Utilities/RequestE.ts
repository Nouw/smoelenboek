import { Request } from "express";
import { User } from "smoelenboek-types";

export interface RequestE extends Request {
	user: User
}

export interface RequestWithAnonymous extends Request {
  user?: User;
  email?: string;
}
