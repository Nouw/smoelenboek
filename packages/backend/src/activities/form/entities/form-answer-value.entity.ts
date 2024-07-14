import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { FormQuestion } from './form-question.entity';
import { FormAnswer } from './form-answer.question';

@Entity()
export class FormAnswerValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  value: string;

  @ManyToOne(() => FormQuestion, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'question_id', referencedColumnName: 'id' }])
  question: Relation<FormQuestion>;

  @ManyToOne(() => FormAnswer, (formAnswer) => formAnswer.values, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  answer: Relation<FormAnswer>;
}
