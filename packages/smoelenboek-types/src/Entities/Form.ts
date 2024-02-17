import {Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation} from "typeorm";
import {Activity} from "./Activity";
import {FormQuestion} from "./FormQuestion";
//TODO: Add some way to order the form
//TODO: Make startup script to check if everything is cascaded, because TypeORM is a bit retarded with that.
@Entity()
export class Form {
	@PrimaryGeneratedColumn("uuid")
		id: string;

	@Column()
		title: string;

	@Column({ type: "text", nullable: true })
		description?: string;

  @Column({ type: "text", nullable: true })
    sheetId?: string;

  @OneToOne(() => Activity, activity => activity.form)
    activity: Relation<Activity>;

  @OneToMany(() => FormQuestion, question => question.form, { cascade: true, onDelete: "CASCADE" })
    questions: Relation<FormQuestion[]>;
}
