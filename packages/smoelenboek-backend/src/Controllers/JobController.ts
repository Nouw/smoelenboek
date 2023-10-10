import { Controller } from "@decorators/express";
import { Authenticated, Guard } from "../Middlewares/AuthMiddleware";

@Controller("/job")
export default class JobController {
  @Authenticated()
  @Guard(["CREATE_TEAM"])
	async syncTeamPhotosJob(@Request() req, @Response() res) {

	}
}
