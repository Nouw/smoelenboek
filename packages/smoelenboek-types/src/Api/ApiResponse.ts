import { Response } from "express";
import { RESPONSE_CODES } from "../Error/Codes";

export class ApiResponse<T> {
	readonly success: boolean;
	readonly data?: T;	
	readonly status: number;
	readonly key: string;

	constructor(success: boolean, resCode: keyof typeof RESPONSE_CODES, data?: T) {
		this.success = success;
		this.status = RESPONSE_CODES[resCode].status;
		this.key = RESPONSE_CODES[resCode].key;
		if (success) {
			this.data = data;
		}
	}

	send(res: Response): void {
		res.status(this.status).json(this);	
	}
}
