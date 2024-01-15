import { Controller, Get, Post, Request, Response } from "@decorators/express";
import { Activity, Form, FormQuestion, FormQuestionItem } from "smoelenboek-types";
import { Database } from "../Database";
import { Authenticated, Guard } from "../Middlewares/AuthMiddleware";
import { matchedData, param } from "express-validator";
import ResponseData from "../Utilities/ResponseData";

@Controller("/activity")
export default class ActivityController {
  @Get("/")
	async getActivities(@Request() req, @Response() res) {
		const activities = await Database.manager.find(Activity, {});

		res.json(ResponseData.build("OK", activities));
	}

  @Get("/:id", [param("id").exists()])
  async getActivity(@Request() req, @Response() res) {
  	const { id } = matchedData(req);

  	const activity = await Database.manager.findOne(Activity, {
  		where: { id }, relations: {
  			form: true,
  		}
  	});

  	res.json(ResponseData.build("OK", activity));
  }

  @Get("/form/:id", [param("id").exists()])
  async getForm(@Request() req, @Response() res) {
  	const { id } = matchedData(req);

  	const form: Form = await Database.manager.findOne(Form, { where: { id }, relations: { questions: true } });

  	for (const key in form.questions) {
  		console.log(key);
  		const question = form.questions[key];

  		if (question.type === "text") {
  			continue;
  		}

  		const items = await Database.manager.find(FormQuestionItem, { where: { question } });

  		form.questions[key].items = items;
  	}

  	res.json(ResponseData.build("OK", form));
  }

  @Post("/")
  @Authenticated()
  @Guard("activity.create")
  async postActivity(@Request() req, @Response() res) {
  	const activityBody: Activity = req.body.activity;
  	const formBody: Form = req.body.form;

  	const activity = Database.manager.create(Activity, activityBody);
  	const form = Database.manager.create(Form, formBody);
  	// Remove all the questions, because this fucks with the questionId in the db
  	form.questions = [];

  	activity.form = form;

  	for (const question of formBody.questions) {
  		const formQuestion = Database.manager.create(FormQuestion, question);

  		//we don't have question items then
  		const items = [];
  		if (formQuestion.type !== "text") {
  			for (const item of question.items) {
  				const questionItem = Database.manager.create(FormQuestionItem, item);
  				questionItem.question = formQuestion;
  				items.push(questionItem);
  			}
  		}
  		formQuestion.items = items;

  		form.questions.push(formQuestion);
  	}

  	await Database.manager.save(activity);

  	res.json(ResponseData.build("OK", null));
  }
}
