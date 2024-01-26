import { ErrorMiddleware, ERROR_MIDDLEWARE } from "@decorators/express";
import express from "express";
import ResponseData from "../Utilities/ResponseData";

export default class ServerErrorMiddleware implements ErrorMiddleware {
	use(error: Error, _: express.Request, res: express.Response, next: express.NextFunction) {
		console.error(error);
		res.status(500).json(ResponseData.build("FAILED", null, error.message));
	}
}
