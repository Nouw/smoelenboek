import { JWT } from "google-auth-library";

import creds from "../../google_service_account.json";

const SCOPES = [
	"https://www.googleapis.com/auth/spreadsheets",
	"https://www.googleapis.com/auth/drive.file",
];

// Initialize auth - see https://theoephraim.github.io/node-google-spreadsheet/#/guides/authentication
export const serviceAccountAuth = new JWT({
	// env var values here are copied from service account credentials generated by google
	// see "Authentication" section in docs for more info
	email: creds.client_email,
	key: creds.private_key,
	scopes: SCOPES,
});
