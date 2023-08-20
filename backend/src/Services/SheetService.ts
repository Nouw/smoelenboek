import { DriveProvider, SheetsProvider } from "../Utilities/Google";
import { Form } from "smoelenboek-types";

export default class SheetService {
	async createSheet(title: string) {
		const driveProvider = await DriveProvider();

		const sheetsProvider = await SheetsProvider();

		const spreadsheet = await sheetsProvider.spreadsheets.create({
			requestBody: {
				properties: {
					title,
				}
			},
			fields: "spreadsheetId"
		});

		return spreadsheet;
	}

	async createFormSheet(form: Form) {
		const sheetProvider = await SheetsProvider();

		const sheet = await sheetProvider.spreadsheets.create({
			requestBody: {
				properties: {
					title: form.name
				}
			},
			fields: "spreadsheetId"
		});

		const values = [[]];
		let questionLength = 1;
		// Loop through all the questions and put the title as column
		for (const item of form.formItem.sections) {
			for (const question of item.questions) {
				values[0].push(question.title);
				questionLength++;
			}
		}
		// Add the questions to the first row
		await sheetProvider.spreadsheets.values.update({
			spreadsheetId: sheet.data.spreadsheetId,
			range: `Sheet1!A1:A${questionLength}`,
			valueInputOption: "RAW",
			requestBody: {
				values
			}
		});

		const driveProvider = await DriveProvider();
		// Get the parent folder
		const file = await driveProvider.files.get({
			fileId: sheet.data.spreadsheetId,
			fields: "parents"
		});

		const prevParents = file.data.parents.join(",");
		// Update parent folder to the shared drive
		await driveProvider.files.update({
			fileId: sheet.data.spreadsheetId,
			addParents: "1U2mvubfrFrAQc9HumRzHhoTpFIajfBxF",
			removeParents: prevParents,
			fields: "id,parents",
			supportsAllDrives: true
		});
		// Add permission that everyone with this link can edit
		await driveProvider.permissions.create({
			fileId: sheet.data.spreadsheetId,
			requestBody: {
				role: "writer",
				type: "anyone"
			},
			supportsAllDrives: true
		});
		// Return the webview link
		return await driveProvider.files.get({
			fileId: sheet.data.spreadsheetId,
			fields: "webViewLink",
			supportsAllDrives: true
		});
	}
}
