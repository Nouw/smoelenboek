import {
  Column,
  Entity,
  JoinTable,
  ManyToMany, ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { User } from "./User";
import { Roles } from "../Auth/Roles";

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  role: Roles;

  @ManyToOne(
    () => User,
    (user) => user.roles,
  )
  user: Relation<User>;
}
