import { GoogleAuth } from "google-auth-library";
import { sheets } from "@googleapis/sheets";
import { drive } from "@googleapis/drive";

const auth = new GoogleAuth({
	scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
});

export async function SheetsProvider() {
	const client = await auth.getClient();

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return sheets({
		version: "v4",
		auth: client
	});
}

export async function DriveProvider() {
	const client = await auth.getClient();

	return drive({
		version: "v3",
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		auth: client
	});
}
