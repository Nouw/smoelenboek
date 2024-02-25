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
import moment from "moment";
import { Database } from "../Database";
import { idExists } from "../Validation/BaseRules";
import { FormRegistration } from "../Controllers/ActivityController";
import { IsNull, Not } from "typeorm";

export default class ActivityService {
  async addRegistrationToSheet(form: Form, formAnswer: FormAnswer) {
    const excel = await new GoogleSpreadsheet(form.sheetId, serviceAccountAuth);

    await excel.loadInfo();

    const sheet = excel.sheetsByIndex[0];
    const row: string[] = [moment(new Date()).format("HH:mm:ss DD-MM-YYYY")];

    form.questions.sort((a, b) => {
      if (a.key < b.key) {
        return -1;
      }

      if (a.key > b.key) {
        return 0;
      }

      return 0;
    });

    for (const question of form.questions) {
      if (!question) {
        continue;
      }

      const answer = formAnswer.values.find((a) => {
        if (a.question === undefined) {
          return false;
        }

        return a.question?.id === question.id;
      });

      if (answer) {
        row.push(answer.value);
      } else {
        row.push("");
      }
    }

    await sheet.addRow(row);
  }

  async removeActivity(activity: Activity) {
    await Database.manager.transaction(async (manager) => {
      if (activity.form) {
        const questions = await manager.find(FormQuestion, {
          relations: { items: true },
        });
        console.log(questions, activity.form);
        for (const question of questions) {
          for (const item of question.items) {
            await manager.remove(item);
          }

          await manager.remove(question);
        }

        // remove the sheet if it exists
        if (activity.form?.sheetId) {
          const doc = await new GoogleSpreadsheet(
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
      answer.firstName = data.firstName;
      answer.lastName = data.lastName;
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
      await this.addRegistrationToSheet(form, answer);
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
