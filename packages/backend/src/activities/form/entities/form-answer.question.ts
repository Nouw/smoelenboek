import { User } from '../../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Form } from './form.entity';
import { FormAnswerValue } from './form-answer-value.entity';

@Entity()
export class FormAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  firstName?: string;

  @Column({ type: 'text', nullable: true })
  lastName?: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user?: Relation<User>;

  @ManyToOne(() => Form, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'form_id', referencedColumnName: 'id' }])
  form: Relation<Form>;

  @OneToMany(() => FormAnswerValue, (formAnswerData) => formAnswerData.answer, {
    cascade: true,
  })
  values: Relation<FormAnswer[]>;

  @CreateDateColumn()
  created: Date;
}
