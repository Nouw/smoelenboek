import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { FormQuestion } from './form-question.entity';

@Entity()
export class FormQuestionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  label: string;

  @Column()
  key: number;

  @ManyToOne(() => FormQuestion, (question) => question.items, {
    onDelete: 'CASCADE',
  })
  question: Relation<FormQuestion>;
}
