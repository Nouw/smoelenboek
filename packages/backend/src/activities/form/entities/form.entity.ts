import { Activity } from '../../../activities/entities/activity.entity';
import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { FormQuestion } from './form-question.entity';

@Entity()
export class Form {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  sheetId?: string;

  @OneToOne(() => Activity, (activity) => activity.form, {
    onDelete: 'CASCADE',
  })
  activity: Relation<Activity>;

  @OneToMany(() => FormQuestion, (question) => question.form, { cascade: true })
  questions: Relation<FormQuestion[]>;
}
