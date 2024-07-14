import {
  Column,
  Entity,
  JoinTable,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Form } from './form.entity';
import { FormQuestionItem } from './form-question-item.entity';

@Entity()
export class FormQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  type: 'text' | 'choice' | 'select' | 'dropdown';

  @Column({ default: false })
  required: boolean;

  @Column({ nullable: true })
  paragraph?: boolean;

  @Column()
  key: number;

  @OneToMany(() => FormQuestionItem, (item) => item, { cascade: true })
  @JoinTable()
  items: Relation<FormQuestionItem[]>;

  @ManyToOne(() => Form, (form) => form.questions, { onDelete: 'CASCADE' })
  form: Relation<Form>;
}
