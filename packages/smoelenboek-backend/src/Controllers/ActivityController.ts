import {
  Controller,
  Delete,
  Get,
  Next,
  Post,
  Put,
  Request,
  Response,
} from "@decorators/express";
import {
  Activity,
  ApiResponse,
  Form,
  FormAnswer,
  FormAnswerValue,
  FormQuestion,
  FormQuestionItem,
} from "smoelenboek-types";
import { Database } from "../Database";
import {
  Authenticated,
  AuthenticatedAnonymous,
  Guard,
} from "../Middlewares/AuthMiddleware";
import { matchedData } from "express-validator";
import ResponseData from "../Utilities/ResponseData";
import { RequestWithAnonymous } from "../Utilities/RequestE";
import { FindOptionsWhere } from "typeorm";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { serviceAccountAuth } from "../Utilities/Google";
import ActivityService from "../Services/ActivityService";
import GoogleSpreadsheetService from "../Services/GoogleSpreadsheetService";
import {
  createFormRules,
  deleteActivityRules,
  deleteSheetLink,
  getActivityParticipants,
  getActivityRules,
  getFormRules,
  getFormSheetSync,
  getPreviousResponse,
  getResponsesRules,
  registrationRules,
  responseRules,
  updateActivityRules,
  updateActivitySettingsRules,
} from "../Validation/ActivityRules";
import { Validate } from "../Middlewares/ValidationMiddleware";
import EntityService from "../Services/EntityService";
import RegistrationService from "../Services/RegistrationService";

export type FormRegistration = {
  [key: string]: string | string[];
};

@Controller("/activity")
export default class ActivityController {
  private readonly activityServer = new ActivityService();
  private readonly spreadsheetService = new GoogleSpreadsheetService();
  private readonly entityService = new EntityService();
  private readonly registrationService = new RegistrationService();

  @Get("/")
  async getActivities(@Request() req: RequestWithAnonymous, @Response() res) {
    const where: FindOptionsWhere<Activity> = {};

    if (!req.user) {
      where.public = true;
    }

    const activities = await Database.manager.find(Activity, {
      where,
      order: {
        date: "DESC",
      },
    });

    new ApiResponse<Activity[]>(true, "ENTITY_RETRIEVED", activities).send(res);
  }

  @Get("/:id", getActivityRules)
  @Validate()
  async getActivity(@Request() req, @Response() res) {
    const { id } = matchedData(req);

    const activity = await Database.manager.findOne(Activity, {
      where: { id },
      relations: {
        form: true,
      },
    });

    new ApiResponse<Activity>(true, "ENTITY_RETRIEVED", activity).send(res);
  }

  @Get("/form/:id", getFormRules)
  @Validate()
  async getForm(@Request() req, @Response() res) {
    const { id } = matchedData(req);

    const form: Form = await Database.manager.findOne(Form, {
      where: { id },
      relations: { questions: true },
    });

    for (const key in form.questions) {
      const question = form.questions[key];

      if (question.type === "text") {
        continue;
      }

      const items = await Database.manager.find(FormQuestionItem, {
        where: { question },
      });

      form.questions[key].items = items;
    }

    new ApiResponse<Form>(true, "ENTITY_RETRIEVED", form).send(res);
  }

  @Post("/register/:id", registrationRules)
  @AuthenticatedAnonymous(false)
  @Validate()
  async postRegistration(
    @Request() req: RequestWithAnonymous,
    @Response() res,
  ) {
    const { id: formId } = matchedData(req);

    await this.activityServer.registerForActivity(
      formId,
      req.body,
      req.user,
      req.email,
    );

    new ApiResponse(true, "ENTITY_CREATED").send(res);
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

    new ApiResponse(true, "ENTITY_CREATED").send(res);
  }

  @Delete("/response/self/:id", registrationRules)
  @AuthenticatedAnonymous(false)
  @Validate()
  async deleteSelfRegistration(
    @Request() req: RequestWithAnonymous,
    @Response() res,
  ) {
    const { id } = matchedData(req);

    await Database.manager.delete(FormAnswer, { id });

    new ApiResponse(true, "ENTITY_DELETED").send(res);
  }

  @Get("/response/:id", responseRules)
  @AuthenticatedAnonymous()
  @Validate()
  async getResponse(
    @Request() req: RequestWithAnonymous,
    @Response() res,
    @Next() next,
  ) {
    const { id } = matchedData(req);
    const where: FindOptionsWhere<FormAnswer> = { form: { id } };

    if (req.email) {
      where.email = req.email;
    } else if (req.user) {
      where.user = req.user;
    } else {
      next(new Error("No identification found in request!"));
    }

    const formAnswer = await Database.manager.findOneByOrFail(
      FormAnswer,
      where,
    );

    if (!formAnswer) {
      res.json(ResponseData.build("OK", null));
      return;
    }

    const answers = await Database.manager.find(FormAnswerValue, {
      select: {
        question: {
          id: true,
        },
      },
      where: { answer: formAnswer },
      relations: { question: true },
    });

    new ApiResponse(true, "ENTITY_RETRIEVED", answers).send(res);
  }

  @Post("/form/sheet/:id", createFormRules)
  @Authenticated()
  @Guard("activity.create")
  @Validate()
  async linkFormToSheet(@Request() req, @Response() res, @Next() next) {
    const { id } = matchedData(req);

    const form = await Database.manager.findOneOrFail(Form, {
      relations: { activity: true, questions: true },
      where: { id },
    });

    if (form.sheetId !== null) {
      next(new Error("This form already has a sheet linked to it!"));
      return;
    }

    const doc = await GoogleSpreadsheet.createNewSpreadsheetDocument(
      serviceAccountAuth,
      { title: form.activity.title },
    );

    await doc.setPublicAccessLevel("writer");

    await this.spreadsheetService.setNameOfDefaultSheet(doc);
    await this.spreadsheetService.setSheetHeaders(form, doc);

    form.sheetId = doc.spreadsheetId;

    await Database.manager.save(form);

    new ApiResponse<{ sheetId: string }>(true, "ENTITY_CREATED", {
      sheetId: doc.spreadsheetId,
    }).send(res);
  }

  @Get("/responses/:id", getResponsesRules)
  @Authenticated()
  @Guard("activity.create")
  @Validate()
  async getActivityResponses(@Request() req, @Response() res) {
    const { id } = matchedData(req);

    const responses = await Database.manager.find(FormAnswer, {
      select: {
        user: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      relations: { user: true, values: { question: true } },
      where: { form: { id } },
    });

    new ApiResponse<FormAnswer[]>(true, "ENTITY_RETRIEVED", responses).send(
      res,
    );
  }

  @Put("/:id", updateActivityRules)
  @Authenticated()
  @Guard("activity.create")
  @Validate()
  async updateActivity(@Request() req, @Response() res) {
    const {
      id,
      location,
      description,
      date,
      registrationOpen,
      max,
      title,
      registrationClosed,
      public: publica,
    } = matchedData(req);

    let activity = await Database.manager.findOneByOrFail(Activity, { id });

    activity = this.entityService.updateEntity<Activity>({
      location,
      description,
      date,
      registrationOpen,
      max,
      title,
      registrationClosed,
      public: publica,
    }, activity);

    await Database.manager.save(activity);

    new ApiResponse(true, "UPDATED_ENTITY", activity).send(res);
  }

  // TODO: Add guard
  @Put("/settings/:id", updateActivitySettingsRules)
  @Authenticated()
  @Validate()
  async updateActivitySettings(@Request() req, @Response() res) {
    const { id, public: publica } = matchedData(req);

    let activity = await Database.manager.findOneByOrFail(Activity, { id });
    activity = this.entityService.updateEntity<Activity>(
      { public: publica },
      activity,
    );

    await Database.manager.save(activity);

    console.log("saved!");

    new ApiResponse(true, "ENTITY_UPDATED").send(res);
  }

  // TODO: Add guard
  @Delete("/:id", deleteActivityRules)
  @Validate()
  async deleteActivity(@Request() req, @Response() res) {
    const { id } = matchedData(req);

    const activity = await Database.manager.findOne(Activity, {
      where: { id },
      relations: { form: true },
    });

    if (activity.form?.sheetId !== null) {
      const doc = await new GoogleSpreadsheet(
        activity.form.sheetId,
        serviceAccountAuth,
      );
      await doc.delete();
    }

    await Database.manager.delete(Activity, id);

    if (activity.form?.id) {
      await Database.manager.delete(Form, activity.form.id);
    }

    new ApiResponse(true, "ENTITY_DELETED").send(res);
  }

  // TODO: Add guard
  @Post("/delete/sheet/:id", deleteSheetLink)
  async deleteSpreadSheet(@Request() req, @Response() res) {
    const { id } = matchedData(req);

    const doc = await new GoogleSpreadsheet(id, serviceAccountAuth);
    await doc.delete();

    res.json("Deleted sheet!");
  }

  @Get("/registrations/")
  @Authenticated()
  async getRegistrations(
    @Request() req: RequestWithAnonymous,
    @Response() res,
  ) {
    if (req.email) {
      new ApiResponse(true, "ENTITY_RETRIEVED").send(res);
    } else {
      new ApiResponse(
        true,
        "ENTITY_RETRIEVED",
        await this.registrationService.getUserRegistrations(req.user.id),
      ).send(res);
    }
  }

  @Get("/registration/:id", getPreviousResponse)
  @AuthenticatedAnonymous()
  @Validate()
  async getPreviousRegistration(
    @Request() req: RequestWithAnonymous,
    @Response() res,
  ) {
    const { id } = matchedData(req);

    if (req.email) {
      new ApiResponse(
        true,
        "ENTITY_RETRIEVED",
        await this.activityServer.getActivityRegistration(
          id,
          undefined,
          req.email,
        ),
      ).send(res);
    } else {
      const registration = await this.activityServer.getActivityRegistration(
        id,
        req.user.id,
      );

      new ApiResponse(true, "ENTITY_RETRIEVED", registration).send(res);
    }
  }

	@Delete("/registration/:id")
	@AuthenticatedAnonymous()
	@Validate()
	async deleteRegistration(@Request() req: RequestWithAnonymous, @Response res) {
		const { id } = matchedData(req);

		await Database.manager.delete(FormAnswer, { id });

		new ApiResponse(true, "ENTITY_DELETED").send(res);
	}

  @Get("/participants/:id", getActivityParticipants)
  @Authenticated()
  @Validate()
  async getParticipants(@Request() req, @Response() res) {
    const { id } = matchedData(req);

    new ApiResponse(
      true,
      "ENTITY_RETRIEVED",
      await this.activityServer.getParticipants(id),
    ).send(res);
  }

  @Post("/form/sheet/sync/:id", getFormSheetSync)
  @Authenticated()
  @Validate()
  async getSyncSheet(@Request() req, @Response() res) {
    const { id } = matchedData(req);

    await this.spreadsheetService.syncResponsesWithSheet(id);

    new ApiResponse(true, "ENTITY_RETRIEVED").send(res);
  }

  @Get("/debug/id")
  @AuthenticatedAnonymous()
  async debugEndpoint(@Request() req, @Response() res) {
    new ApiResponse(
      true,
      "ENTITY_RETRIEVED",
      await this.spreadsheetService.syncResponsesWithSheet(
        "8cf78a8a-c107-4be3-9a54-06f782648f61",
      ),
    ).send(res);
  }
}
