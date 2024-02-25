import { body, param } from "express-validator";
import { idExists } from "./BaseRules";

export const getActivityRules = [idExists];
export const getFormRules = [idExists];
export const registrationRules = [idExists];
export const responseRules = [idExists];
export const createFormRules = [idExists];
export const getResponsesRules = [idExists];
export const updateActivityRules = [
  param("id").exists(),
  body(["location", "description", "max", "title"]),
  body("public").toBoolean(),
  body("date").toDate(),
  body("registrationOpen").toDate(),
  body("registrationClosed").toDate(),
];
export const deleteActivityRules = [idExists];
export const getPreviousResponse = [idExists];
export const getActivityParticipants = [idExists];
export const getFormSheetSync = [idExists];
