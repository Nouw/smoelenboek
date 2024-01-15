import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation
} from "typeorm";
import { User } from "./User";
import {Form} from "./Form";

@Entity()
export class Activity {
  @PrimaryGeneratedColumn()
  	id: number;

  @Column()
  	title: string;

  @Column({ nullable: true, type: "text" })
  description: string;

  @Column()
  	location: string;

  @Column({ type: "timestamp" })
  	date: Date;

  @Column({ type: "timestamp" })
  	registrationOpen: Date;

  @Column({ type: "timestamp" })
    registrationClosed: Date;

  @Column({ default: 0 })
  	max: number;

  @OneToOne(() => Form, form => form.activity)
  @JoinColumn()
    form: Relation<Form>;

  @ManyToMany(() => User, user => user.activities)
  @JoinTable()
  	users: Relation<User[]>;

}
