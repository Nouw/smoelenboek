import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { SerializedLexicalNode } from "lexical";
import {FormItem} from "../FormItem";

@Entity()
export class Form {
	@PrimaryGeneratedColumn("uuid")
		id: string;

	@Column()
		name: string;

	@Column({ type: "json", nullable: true })
		description?: SerializedLexicalNode;

	@Column({ type: "timestamp" })
		registrationOpen: Date;

	@Column({ type: "timestamp" })
		registrationClosed: Date;

	@Column({ type: "blob", transformer: {
		to: (value: FormItem) => Buffer.from(JSON.stringify(value)),
		from: (value: Buffer) => JSON.parse(value.toString())
	} })
		formItem: FormItem;

	@Column({ nullable: true })
		sheetLink?: string;
}
