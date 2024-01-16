import {Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation} from "typeorm";
import {User} from "./User";
import {FormAnswerValue} from "./FormAnswerValue";

@Entity()
export class FormAnswer {
  @PrimaryGeneratedColumn("uuid")
    id: string;

  @Column({ type: "text", nullable: true })
    firstName?: string;

  @Column({ type: "text", nullable: true })
    lastName?: string;

  @OneToOne(() => User)
  @JoinColumn()
    user?: Relation<User>;

  @OneToMany(() => FormAnswerValue, formAnswerData => formAnswerData.answer, { cascade: true })
    values: Relation<FormAnswerValue[]>;
}
