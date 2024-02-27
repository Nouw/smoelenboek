import {Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation} from "typeorm";
import {FormQuestion} from "./FormQuestion";

@Entity()
export class FormQuestionItem {
  @PrimaryGeneratedColumn("uuid")
    id: string;

  @Column()
    label: string;

  @Column()
    key: number;

  @ManyToOne(() => FormQuestion, (question) => question.items, { onDelete: "CASCADE" })
    question: Relation<FormQuestion>;
}
