import { DataSource } from "typeorm";
import dotenv from "dotenv";
import {
	Activity,
	Category,
	Committee,
	File,
	Form,
	Permission,
	Photo,
	Photobook,
	ProtototoMatch,
	ProtototoPredictionResults,
	ProtototoPredictions,
	ProtototoPredictionsExternal,
	ProtototoResults,
	ProtototoSeason,
	Role,
	Season,
	Team,
	User,
	UserCommitteeSeason,
	UserTeamSeason
} from "smoelenboek-types";

dotenv.config();

const root = process.env.PRODUCTION === "false" ? "src" : "dist";
const extension = process.env.PRODUCTION === "false" ? "ts" : "js";
console.log("hello worlds")
export const Database = new DataSource({
	type: "mysql",
	host: process.env.MYSQL_HOSTNAME ?? "localhost",
	port: parseInt(process.env.MYSQL_PORT) ?? 3306,
	username: process.env.MYSQL_USERNAME ?? "root",
	password: process.env.MYSQL_PASSWORD ?? "root",
	database: process.env.MYSQL_DATABASE ?? "smoelenboek",
	entities:  [
		Activity, Category, Committee, File, Form, Permission, Photo, Photobook, ProtototoMatch, ProtototoPredictionResults,
		ProtototoPredictions, ProtototoPredictionsExternal, ProtototoResults, ProtototoSeason, Role, Season, Team, User,
		UserCommitteeSeason, UserTeamSeason
	],
	subscribers: [root + "/Subscribers/**/*." + extension],
	migrations: [root + "/Migrations/**/*." + extension],
	synchronize: false,
});

