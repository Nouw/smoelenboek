import { Controller, Post, Request, Response } from "@decorators/express";
import { Authenticated, Guard } from "../Middlewares/AuthMiddleware";
import TeamPhotoQueue from "../Queues/TeamPhotoQueue";
import ResponseData from "../Utilities/ResponseData";

@Controller("/job")
export default class JobController {
  @Authenticated()
  @Guard(["CREATE_TEAM"])
  @Post("/teamPhoto")
  async syncTeamPhotosJob(@Request() req, @Response() res) {
    TeamPhotoQueue.add({});

    res.json(ResponseData.build("OK", "Added team photo sync to job queue!"));
    return;
  }
}
