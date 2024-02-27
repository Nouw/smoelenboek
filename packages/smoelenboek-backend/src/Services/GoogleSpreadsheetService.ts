import { Form, FormAnswer } from "smoelenboek-types";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { Database } from "../Database";
import { serviceAccountAuth } from "../Utilities/Google";
import moment from "moment";

export default class GoogleSpreadsheetService {
  async setNameOfDefaultSheet(spreadsheet: GoogleSpreadsheet) {
    await spreadsheet.loadInfo();

    const sheet = await spreadsheet.sheetsByIndex[0];

    await sheet.updateProperties({ title: "Form Answers" });

    return;
  }

  async setSheetHeaders(form: Form, spreadsheet: GoogleSpreadsheet) {
    await spreadsheet.loadInfo();

    const sheet = await spreadsheet.sheetsByTitle["Form Answers"];
    // TODO: Probably should add translations or smth
    await sheet.setHeaderRow([
      "Created",
      "Name",
      "Email",
      ...form.questions.map((q) => q.title),
    ]);

    return;
  }

  async syncResponsesWithSheet(id: string) {
    const form = await Database.manager.findOneOrFail(Form, {
      select: {
        questions: {
          id: true,
          title: true,
        },
      },
      relations: {
        questions: true,
        activity: true,
      },
      where: { id },
    });

    const answers = await Database.manager.find(FormAnswer, {
      select: {
        email: true,
        firstName: true,
        lastName: true,
        created: true,
        user: {
          firstName: true,
          lastName: true,
          email: true,
        },
        values: {
          value: true,
          question: {
            id: true,
          },
        },
      },
      relations: { values: { question: true }, user: true },
      where: { form },
    });

    const spreadsheet = new GoogleSpreadsheet(
      form.sheetId,
      serviceAccountAuth,
    );

    await spreadsheet.loadInfo();

    const sheet = spreadsheet.sheetsByTitle["Form Answers"];

    sheet.clear();

    await this.setSheetHeaders(form, spreadsheet);

    const rows = [];

    for (const answer of answers) {
      rows.push(this.formatRow(form, answer));
    }

    await sheet.addRows(rows);

    return;
  }

  async addSingleRegistration(answer: FormAnswer) {
    const form = await Database.manager.findOneOrFail(Form, {
      select: {
        questions: {
          id: true,
          title: true,
        },
      },
      relations: {
        questions: true,
        activity: true,
      },
      where: { id: answer.form.id },
    });

    const spreadsheet = new GoogleSpreadsheet(
      form.sheetId,
      serviceAccountAuth,
    );

    await spreadsheet.loadInfo();

    const sheet = spreadsheet.sheetsByTitle["Form Answers"];
    const row = this.formatRow(form, answer);

    return sheet.addRow(row);
  }

  private formatRow(form: Form, answer: FormAnswer): Array<any> {
    let name: string;

    if (answer.firstName) {
      name = `${answer.firstName} ${answer.lastName}`;
    } else {
      name = `${answer.user.firstName} ${answer.user.lastName}`;
    }

    return [
      moment(new Date()).format("HH:mm:ss DD-MM-YYYY"),
      name,
      answer.email ?? answer.user.email,
      ...form.questions.sort((a, b) => {
        if (a.key < b.key) {
          return -1;
        }

        if (a.key > b.key) {
          return 0;
        }

        return 0;
      }).map((question) => {
        const value = answer.values.find((v) => v.question.id === question.id);

        return value?.value ?? "";
      }),
    ];
  }
}
