import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { Permission } from "./Permission";
import { User } from "./User";

export enum Roles {
  DEFAULT = 1,
  ADMIN,
  TEMP,
}

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @ManyToMany(
    () => User,
    (user) => user.roles,
  )
  users: Relation<User[]>;

  @ManyToMany(
    () => Permission,
    (permission) => permission.roles,
    {
      cascade: true,
    },
  )
  @JoinTable()
  permissions: Relation<Permission[]>;
}
