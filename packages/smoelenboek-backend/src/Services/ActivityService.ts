import { Form, FormAnswer } from "smoelenboek-types";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { serviceAccountAuth } from "../Utilities/Google";
import moment from "moment";

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
			const answer = formAnswer.values.find((a) => a.question.id === question.id);

			if (answer) {
				row.push(answer.value);
			} else {
				row.push("");
			}
		}

		await sheet.addRow(row);
	}
}
