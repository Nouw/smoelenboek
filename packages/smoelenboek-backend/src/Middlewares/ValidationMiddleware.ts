import { attachMiddleware } from "@decorators/express"
import { validationResult } from "express-validator"

export function Validate() {
	return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		attachMiddleware(target, propertyKey, (req, _res, next) => {
			const errors = validationResult(req);

			if (errors.isEmpty()) {
				return next();
			} else {
				return next(errors.array());
			}	
		})
	}
}
