import { Controller, Get, Post, Request, Response } from "@decorators/express";
import { Database } from "../Database";
import { Form } from "smoelenboek-types";
import ResponseData from "../Utilities/ResponseData";
import SheetService from "../Services/SheetService";

@Controller("/form")
export default class FormController {
	// Shared drive of smoelenboek
	private driveId = "0AMsu_hl6iiKLUk9PVA";
	@Get("/:id")
	async getForm(@Request() req, @Response() res) {
		const id = req.params.id;

		const form = await Database.manager.findOneBy(Form, { id });

		res.json(form);
	}

	@Post("/")
	async createForm(@Request() req, @Response() res) {
		const form = req.body.form as Form;

		await Database.manager.save(form);

		const spreadsheetService = new SheetService();
		const link = await spreadsheetService.createFormSheet(form);

		form.sheetLink = link.data.webViewLink;

		await Database.manager.save(form);

		res.json(ResponseData.build("OK", form, "successfully stored Form"));
	}
}
