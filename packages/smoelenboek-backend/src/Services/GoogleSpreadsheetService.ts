import { Form } from "smoelenboek-types";
import { GoogleSpreadsheet } from "google-spreadsheet";

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
		await sheet.setHeaderRow(["Created", ...form.questions.map((q) => q.title)]);

		return;
	}
}
