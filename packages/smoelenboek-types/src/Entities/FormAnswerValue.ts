import {Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation} from "typeorm";
import {FormQuestion} from "./FormQuestion";
import {FormAnswer} from "./FormAnswer";

@Entity()
export class FormAnswerValue {
  @PrimaryGeneratedColumn()
    id: number;

  @Column({ type: "text" })
    value: string;

  @ManyToOne(() => FormQuestion)
  @JoinColumn([{ name: 'question_id', referencedColumnName: 'id' }])
    question: Relation<FormQuestion>;

  @ManyToOne(() => FormAnswer, formAnswer => formAnswer.values)
  @JoinColumn()
    answer: Relation<FormAnswer>;
}
