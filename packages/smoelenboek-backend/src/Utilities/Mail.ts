import * as nodemailer from "nodemailer";
import Mailgen, { Action, Table } from "mailgen";

export default class Mail {
	private mailGenerator = new Mailgen({
		theme: "default",
		product: {
			name: "Smoelenboek",
			link: "https://smoelenboek.usvprotos.nl",
		}
	});

	private readonly subject: string;
	private readonly to: string;
	private readonly name: string;

	private table?: Table;
	private intro?: string | string[];
	private greeting?: string;
	private action: Action[] = [];

	private transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: "webcie@usvprotos.nl",
			pass: process.env.MAIL_PASSWORD,
		},
	});

	constructor(subject: string, to: string) {
		this.subject = subject;
		this.to = to;
	}

	addIntro(intro: string | string[]) {
		this.intro = intro;

		return this;
	}

	addTable(table: Table) {
		this.table = table;

		return this;
	}

	addGreeting(greeting: string) {
		this.greeting = greeting;

		return this;
	}

	addAction(action: Action) {
		this.action.push(action);

		return this;
	}

	async send() {
		const mail = {
			name: this.name,
			body: {
				greeting: this.greeting,
				intro: this.intro,
				table: this.table,
				signature: "Met vriendelijke groet",
				action: this.action,
			}
		};

		const html = this.mailGenerator.generate(mail);
		const text = this.mailGenerator.generatePlaintext(mail);

		await this.transporter.sendMail({
			from: "webie@usvprotos.nl",
			to: this.to,
			subject: this.subject,
			html,
			text
		});
	}
}
