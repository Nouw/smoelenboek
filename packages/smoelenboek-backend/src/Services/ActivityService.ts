import {
  Activity,
  Form,
  FormAnswer,
  FormAnswerValue,
  FormQuestion,
  User,
} from "smoelenboek-types";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { serviceAccountAuth } from "../Utilities/Google";
import { Database } from "../Database";
import { FormRegistration } from "../Controllers/ActivityController";
import { IsNull, Not } from "typeorm";
import GoogleSpreadsheetService from "./GoogleSpreadsheetService";

export default class ActivityService {
  private sheetsService = new GoogleSpreadsheetService();

  async removeActivity(activity: Activity) {
    await Database.manager.transaction(async (manager) => {
      if (activity.form) {
        const questions = await manager.find(FormQuestion, {
          relations: { items: true },
        });

        for (const question of questions) {
          for (const item of question.items) {
            await manager.remove(item);
          }

          await manager.remove(question);
        }

        // remove the sheet if it exists
        if (activity.form?.sheetId) {
          const doc = new GoogleSpreadsheet(
            activity.form.sheetId,
            serviceAccountAuth,
          );
          await doc.delete();
        }

        await manager.remove(Form, activity.form);
      }
      await manager.remove(Activity, activity);
    });
  }

  async getActivityRegistration(
    formId: string,
    userId?: number,
    email?: string,
  ) {
    const response = await this.getResponse(formId, userId, email);

    if (!response) {
      return null;
    }

    const mergedOptions = response.values.reduce((acc, { value, question }) => {
      // If the question.id is not yet a key in the accumulator, add it with an empty array
      if (!acc[question.id]) {
        acc[question.id] = [];
      }

      // Push the current value into the array of the corresponding question.id
      acc[question.id].push(value);

      return acc;
    }, {} as Record<string, string[]>);

    // If you need the result as an array of objects with a structure similar to the original:
    const result = Object.entries(mergedOptions).map((
      [questionId, values],
    ) => ({
      question: { id: questionId },
      value: values.length === 1 ? values[0] : values,
    }));

    return result;
  }

  async registerForActivity(
    formId: string,
    data: FormRegistration,
    user?: User,
    email?: string,
  ) {
    const registration = await this.getResponse(
      formId,
      user?.id,
      email,
    );

    if (registration) {
      await Database.manager.delete(FormAnswer, { id: registration.id });
    }

    const form = await Database.manager.findOneOrFail(Form, {
      where: { id: formId },
      relations: { questions: true },
    });

    const answer = new FormAnswer();
    answer.form = form;
    answer.values = [];

    if (email) {
      answer.email = email;
      answer.firstName = data.firstName as string;
      answer.lastName = data.lastName as string;
    } else {
      answer.user = user;
    }

    for (const key in data) {
      if (["email", "firstName", "lastName"].includes(key)) {
        continue;
      }

      const storeAnswerValue = async (key: string, formValue: string) => {
        const value = new FormAnswerValue();

        const question = await Database.manager.findOneByOrFail(FormQuestion, {
          id: key,
        });

        value.question = question;
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

    if (form.sheetId) {
      await this.sheetsService.addSingleRegistration(answer);
    }

    await Database.manager.save(answer);
  }

  async getParticipants(id: number) {
    const activity = await Database.manager.findOneOrFail(Activity, {
      relations: { form: true },
      where: { id },
    });

    return Database.manager.find(FormAnswer, {
      select: {
        user: {
          firstName: true,
          lastName: true,
        },
      },
      where: { form: activity.form, user: Not(IsNull()) },
      relations: { user: true },
    });
  }

  private async getResponse(formId: string, userId?: number, email?: string) {
    let response: FormAnswer;

    if (userId) {
      response = await Database.manager.createQueryBuilder(FormAnswer, "f")
        .select()
        .innerJoin("f.user", "u")
        .innerJoin("f.form", "fo")
        .innerJoinAndSelect("f.values", "fv")
        .innerJoin("fv.question", "q")
        .addSelect(["q.id"])
        .where("fo.id = :formId", { formId })
        .andWhere("u.id = :userId", {
          userId,
        })
        .orderBy("f.created", "DESC")
        .getOne();
    } else {
      response = await Database.manager.createQueryBuilder(FormAnswer, "f")
        .select()
        .innerJoin("f.form", "fo")
        .innerJoinAndSelect("f.values", "fv")
        .innerJoin("fv.question", "q")
        .addSelect(["q.id"])
        .where("fo.id = :formId", { formId })
        .andWhere("f.email = :email", {
          email,
        })
        .orderBy("f.created", "DESC")
        .getOne();
    }

    return response;
  }
}
