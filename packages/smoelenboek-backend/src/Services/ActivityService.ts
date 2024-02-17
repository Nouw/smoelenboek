import { Activity, Form, FormAnswer, FormQuestion } from "smoelenboek-types";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { serviceAccountAuth } from "../Utilities/Google";
import moment from "moment";
import { Database } from "../Database";

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
}
