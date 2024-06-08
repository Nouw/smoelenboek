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
  Committee,
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
  IsAdmin,
  isBoard,
} from "../Middlewares/AuthMiddleware";
import { matchedData } from "express-validator";
import ResponseData from "../Utilities/ResponseData";
import { RequestE, RequestWithAnonymous } from "../Utilities/RequestE";
import { FindOptionsWhere } from "typeorm";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { serviceAccountAuth } from "../Utilities/Google";
import ActivityService from "../Services/ActivityService";
import GoogleSpreadsheetService from "../Services/GoogleSpreadsheetService";
import {
  createFormRules,
  deleteActivityRules,
  deleteRegistration,
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
  private readonly activityService = new ActivityService();
  private readonly spreadsheetService = new GoogleSpreadsheetService();
  private readonly entityService = new EntityService();
  private readonly registrationService = new RegistrationService();

	@AuthenticatedAnonymous(false)
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

  @AuthenticatedAnonymous(false)
  @Validate()
  @Get("/:id", getActivityRules)
  async getActivity(@Request() req, @Response() res) {
    const { id } = matchedData(req);

    const activity = await Database.manager.findOne(Activity, {
      where: { id },
      relations: {
        form: true,
        commitee: true,
      },
    });
     
    if (!req.user && !activity.public) {
      new ApiResponse<Activity>(false, "ACCESS_DENIED").send(res);
      return
    }

    new ApiResponse<Activity>(true, "ENTITY_RETRIEVED", activity).send(res);
  }
  
  @AuthenticatedAnonymous(false)
  @Validate()
  @Get("/form/:id", getFormRules)
  async getForm(@Request() req, @Response() res) {
    const { id } = matchedData(req);
    // Prevent anonymous users from seeing the form
    const activity = await Database.manager.findOne(Activity, { where: { form: { id } }});
    
    if (!activity.public && !req.user) {
      new ApiResponse<Form>(false, "ACCESS_DENIED").send(res);
      return 
    }

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

  @AuthenticatedAnonymous(false)
  @Validate()
  @Post("/register/:id", registrationRules)
  async postRegistration(
    @Request() req: RequestWithAnonymous,
    @Response() res,
  ) {
    const { id: formId } = matchedData(req);

    await this.activityService.registerForActivity(
      formId,
      req.body,
      req.user,
      req.email,
    );

    new ApiResponse(true, "ENTITY_CREATED").send(res);
  }

  @Authenticated()
  @Guard("activity.create")
  @Post("/")
  async postActivity(@Request() req, @Response() res) {
    const activityBody: Activity = req.body.activity;
    const formBody: Form = req.body.form;
    
    const committee = await Database.manager.findOneOrFail(Committee, { where: { id: req.body.committee }})
    const activity = Database.manager.create(Activity, activityBody);
    activity.commitee = committee;
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

  @AuthenticatedAnonymous(false)
  @Validate()
  @Delete("/response/self/:id", registrationRules)
  async deleteSelfRegistration(
    @Request() req: RequestWithAnonymous,
    @Response() res,
  ) {
    const { id } = matchedData(req);

    await Database.manager.delete(FormAnswer, { id });

    new ApiResponse(true, "ENTITY_DELETED").send(res);
  }
	
	@AuthenticatedAnonymous()
  @Validate()
  @Get("/response/:id", responseRules)
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

	@Authenticated()
  @Guard("activity.create")
  @Validate()
  @Post("/form/sheet/:id", createFormRules) 
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

	@Authenticated()
  @Guard("activity.create")
  @Validate()
  @Get("/responses/:id", getResponsesRules)
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

	@Authenticated()
  @Guard("activity.create")
  @Validate()
  @Put("/:id", updateActivityRules) 
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
  @Authenticated()
  @Validate()
	@Put("/settings/:id", updateActivitySettingsRules)
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
	@Validate()
  @Delete("/:id", deleteActivityRules)
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

	@Authenticated()
  @Get("/registrations/") 
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

	@AuthenticatedAnonymous()
  @Validate()
  @Get("/registration/:id", getPreviousResponse)
  async getPreviousRegistration(
    @Request() req: RequestWithAnonymous,
    @Response() res,
  ) {
    const { id } = matchedData(req);

    if (req.email) {
      new ApiResponse(
        true,
        "ENTITY_RETRIEVED",
        await this.activityService.getActivityRegistration(
          id,
          undefined,
          req.email,
        ),
      ).send(res);
    } else {
      const registration = await this.activityService.getActivityRegistration(
        id,
        req.user.id,
      );

      new ApiResponse(true, "ENTITY_RETRIEVED", registration).send(res);
    }
  }

	@AuthenticatedAnonymous()
  @Validate()
  @Delete("/registration/:id", deleteRegistration) // TODO: Add rules  
  async deleteRegistration(
    @Request() req: RequestWithAnonymous,
    @Response() res,
  ) {
    const { id } = matchedData(req);

    await Database.manager.delete(FormAnswer, { id });

    new ApiResponse(true, "ENTITY_DELETED").send(res);
  }

	@Authenticated()
  @Validate()
  @Get("/participants/:id", getActivityParticipants) 
  async getParticipants(@Request() req, @Response() res) {
    const { id } = matchedData(req);

    new ApiResponse(
      true,
      "ENTITY_RETRIEVED",
      await this.activityService.getParticipants(id),
    ).send(res);
  }

  @Authenticated() 
  @Validate()
	@Post("/form/sheet/sync/:id", getFormSheetSync)
  async getSyncSheet(@Request() req, @Response() res) {
    const { id } = matchedData(req);

    await this.spreadsheetService.syncResponsesWithSheet(id);

    new ApiResponse(true, "ENTITY_RETRIEVED").send(res);
  }
 
  @Authenticated()
  @Get("/managed/list")
  async getManagedActivities(@Request() req: RequestE, @Response() res) {
    let query = Database.manager.createQueryBuilder(Activity, "a")
      .select("a")
      .innerJoin("a.commitee", "c")
      .innerJoin("c.userCommitteeSeason", "ucs")
      .innerJoin("ucs.user", "u")
      .where("ucs.seasonId = :seasonId", { seasonId: 21 }) // TODO: Get current season
      .andWhere("u.id = :userId", { userId: req.user.id }) 
    
    if (!IsAdmin(req.user) && !isBoard(req.user)) {
      query = query.andWhere("c.id = ucs.committee.id")
    }
    
    const activities = await query.getMany();

    new ApiResponse(true, "ENTITY_RETRIEVED", activities).send(res);
  }

  @AuthenticatedAnonymous(false)
  @Get("/debug/wtf")
  async debugEndpoint(@Request() req, @Response() res) {
    const where: FindOptionsWhere<Activity> = {};

    if (!req.user) {
      where.public = true;
    }
    console.log(where, req.user);
    const activities = await Database.manager.find(Activity, {
      where,
      order: {
        date: "DESC",
      },
    });

    res.json(activities);
  }
}
