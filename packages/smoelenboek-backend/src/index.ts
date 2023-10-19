import express, { Express } from "express";
import { attachControllers } from "@decorators/express";
import dotenv from "dotenv";
import logger from "./Utilities/Logger";
import { json, urlencoded } from "body-parser";
import AuthController from "./Controllers/AuthController";
import { Type } from "@decorators/express/lib/src/middleware";
import ServerErrorMiddleware from "./Middlewares/ServerErrorMiddleware";
import { ERROR_MIDDLEWARE } from "@decorators/express";
import { Container } from "@decorators/di";
import { Database } from "./Database";
import CommitteeController from "./Controllers/CommitteeController";
import DocumentController from "./Controllers/DocumentController";
import FormController from "./Controllers/FormController";
import cors from "cors";
import TeamController from "./Controllers/TeamController";
import UserController from "./Controllers/UserController";
import SeasonController from "./Controllers/SeasonController";
import ProtototoController from "./Controllers/ProtototoController";
import JobController from "./Controllers/JobController";
import TeamPhotoQueue from "./Queues/TeamPhotoQueue";


dotenv.config();

const app: Express = express();

const controllers: Type[] = [
	AuthController,
	CommitteeController,
	DocumentController,
	FormController,
	TeamController,
	UserController,
	SeasonController,
	ProtototoController,
    JobController,
];

const corsAllowed = [
	"http://localhost:3000",
  'https://smoelenboek.usvprotos.nl',
  "http://127.0.0.1:4173/"
];

const middlewares = [
	urlencoded({ extended: true, limit: "20mb" }),
	json(),
	cors(null, (req: Request, cb) => {
		const options = { origin: false };

		if (corsAllowed.includes(req.headers.get("Origin"))) {
			options.origin = true;
		}

		cb(null, options);
	})
];

async function run() {
	await Database.initialize();

	Container.provide([
		{ provide: ERROR_MIDDLEWARE, useClass: ServerErrorMiddleware }
	]);

	middlewares.forEach((middleware) => {
		app.use(middleware);
	});

	await attachControllers(app, controllers);

	const port = parseInt(process.env.WEBSERVER_PORT) ?? 8080;

	app.listen(port);

	logger.info(`Server is running on port: ${port}`);

    // TeamPhotoQueue.empty();
    // logger.info('Cleaned job queue for TeamPhotoQueue');
}

run();
