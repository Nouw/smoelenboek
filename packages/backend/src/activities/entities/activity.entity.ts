import { Committee } from '../../committees/entities/committee.entity';
import { User } from '../../users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Form } from '../form/entities/form.entity';

@Entity()
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column()
  location: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'timestamp' })
  registrationOpen: Date;

  @Column({ type: 'timestamp' })
  registrationClosed: Date;

  @Column({ default: 0 })
  max: number;

  @Column({ default: false })
  public: boolean;

  @ManyToOne(() => Committee)
  @JoinColumn([{ name: 'committe_id', referencedColumnName: 'id' }])
  commitee: Committee;

  @OneToOne(() => Form, (form) => form.activity, { cascade: true })
  @JoinColumn()
  form: Relation<Form>;

  @ManyToMany(() => User, (user) => user.activities)
  @JoinTable()
  users: Relation<User[]>;
}
