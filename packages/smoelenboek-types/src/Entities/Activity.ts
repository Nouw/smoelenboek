import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { User } from "./User";

@Entity()
export class Activity {
  @PrimaryGeneratedColumn()
  	id: number;

  @Column()
  	name: string;

  @Column()
  	location: string;

  @Column({ nullable: true, type: "text" })
  	description: string;

  @Column({ type: "timestamp" })
  	date: Date;

  @Column({ type: "timestamp" })
  	registrationEnd: Date;

  @Column({ type: "timestamp" })
  	registrationOpen: Date;

  @Column({ default: 0 })
  	max: number;

  @Column({ nullable: true, type: "text" })
  	forms: string;

  @Column({ nullable: true, type: "text" })
  	formId: string;

  @ManyToMany(() => User, user => user.activities)
  @JoinTable()
  	users: Relation<User[]>;
}
