import {Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation} from "typeorm";
import {FormItem} from "../FormItem";
import {Activity} from "./Activity";
import {FormQuestion} from "./FormQuestion";

@Entity()
export class Form {
	@PrimaryGeneratedColumn("uuid")
		id: string;

	@Column()
		title: string;

	@Column({ type: "text", nullable: true })
		description?: string;

  @OneToOne(() => Activity, activity => activity.form)
    activity: Relation<Activity>;

  @OneToMany(() => FormQuestion, question => question.form, { cascade: true })
    questions: Relation<FormQuestion[]>;
}
