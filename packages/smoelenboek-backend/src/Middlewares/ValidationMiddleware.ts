import { attachMiddleware } from "@decorators/express"
import { validationResult } from "express-validator"

export function Validate() {
	return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		attachMiddleware(target, propertyKey, async (req, next) => {
			const errors = validationResult(req);

			if (errors.isEmpty()) {
				return next();
			} else {
				return next(errors.array());
			}	
		})
	}
}
