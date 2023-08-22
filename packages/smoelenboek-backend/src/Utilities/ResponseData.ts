export default class ResponseData {
	static build(status: "OK" | "FAILED", data: any, message?: string) {
		return {
			status,
			data,
			message
		};
	}
}
