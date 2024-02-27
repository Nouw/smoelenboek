import { param } from "express-validator";

export const idExists = param("id").exists();
