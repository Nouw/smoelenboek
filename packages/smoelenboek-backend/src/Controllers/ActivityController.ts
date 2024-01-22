import { Controller, Get, Next, Post, Request, Response } from "@decorators/express";
import { Activity, Form, FormAnswer, FormAnswerValue, FormQuestion, FormQuestionItem } from "smoelenboek-types";
import { Database } from "../Database";
import { Authenticated, AuthenticatedAnonymous, Guard } from "../Middlewares/AuthMiddleware";
import { body, matchedData, param, validationResult } from "express-validator";
import ResponseData from "../Utilities/ResponseData";
import { RequestWithAnonymous } from "../Utilities/RequestE";
import { FindOptionsWhere } from "typeorm";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { serviceAccountAuth } from "../Utilities/Google";

type FormRegistration = {
  [key: string]: string | string[]
}

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

  @AuthenticatedAnonymous()
  @Post("/register/:id", [param("id").exists()])
  async postRegistration(@Request() req: RequestWithAnonymous, @Response() res) {
  	const { formId } = matchedData(req);

  	const form = await Database.manager.findOneBy(Form, { id: formId });

  	if (!form) {
  		res.json(ResponseData.build("FAILED", null, "Could not find form"));
  		return;
  	}

  	const data: FormRegistration = req.body;
  	console.log(data);
  	const answer = new FormAnswer();
  	answer.form = form;
  	answer.values = [];

  	if (req.email) {
  		answer.email = req.email;
  	} else {
  		answer.user = req.user;
  	}

  	for (const key in data) {
  		const storeAnswerValue = async (key: string, formValue: string) => {
  			const value = new FormAnswerValue();
  			value.question = await Database.manager.findOneBy(FormQuestion, { id: key });
  			value.value = formValue;
  			value.answer = answer;

  			return value;
  		};

  		if (data[key] instanceof Array) {
  			for (const value of data[key]) {
  				answer.values.push(await storeAnswerValue(key, value));
  			}
  		} else {
  			answer.values.push(await storeAnswerValue(key, data[key] as string));
  		}
  	}

  	await Database.manager.save(answer);

  	res.json(ResponseData.build("OK", null));
  }

  @AuthenticatedAnonymous()
  @Get("/response/:id", [param("id").exists()])
  async getResponse(@Request() req: RequestWithAnonymous, @Response() res, @Next() next) {
  	const { id } = matchedData(req);
  	const where: FindOptionsWhere<FormAnswer> = { form: { id } };

  	if (req.email) {
  		where.email = req.email;
  	} else if (req.user) {
  		where.user = req.user;
  	} else {
  		next(new Error("No identification found in request!"));
  	}

  	const formAnswer = await Database.manager.findOneBy(FormAnswer, where);

  	if (!formAnswer) {
  		res.json(ResponseData.build("OK", null));
  		return;
  	}

  	const answers = await Database.manager.find(FormAnswerValue, {
  		select: {
  			question: {
  				id: true
  			}
  		},
  		where: { answer: formAnswer },
  		relations: { question: true }
  	});

  	res.json(ResponseData.build("OK", answers));
  }

  @Authenticated()
  @Guard("activity.create")
  @Post("/form/sheet/:formId", [param("formId").exists()])
  async createForm(@Request() req, @Response() res, @Next() next) {
  	const errors = validationResult(req);

  	if (!errors.isEmpty()) {
  		next(new Error(errors.array()[0].msg));
  		return;
  	}

  	const { id } = matchedData(req);

  	const form = await Database.manager.findOne(Form, { relations: { activity: true }, where: { id } });

  	if (form.sheetId !== undefined) {
  		next(new Error("This form already has a sheet linked to it!"));
  		return;
  	}

  	if (!form) {
  		next(new Error(`Could not find form with id: ${id}`));
  		return;
  	}

  	const doc = await GoogleSpreadsheet.createNewSpreadsheetDocument(serviceAccountAuth, { title: form.activity.title });

  	await doc.setPublicAccessLevel("writer");

  	form.sheetId = doc.spreadsheetId;

  	res.json(ResponseData.build("OK", { sheetId: doc.spreadsheetId }, "Created google sheet!"));
  }
}
