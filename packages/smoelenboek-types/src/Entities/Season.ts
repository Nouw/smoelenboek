import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Relation } from "typeorm";
import { UserTeamSeason } from "./UserTeamSeason";
import { UserCommitteeSeason } from "./UserCommitteeSeason";

@Entity()
export class Season {

  @PrimaryGeneratedColumn()
  	id: number;

  @Column()
  	name: string;

  @Column({ type: "date" })
  	startDate: Date;

  @Column({ type: "date" })
  	endDate: Date;

  @Column()
  	current: boolean;

  @OneToMany(() => UserTeamSeason, userTeam => userTeam.season)
  	userTeamSeason!: Relation<UserTeamSeason[]>;

  @OneToMany(() => UserCommitteeSeason, userCommittee => userCommittee.season)
  	userCommitteeSeason!: Relation<UserCommitteeSeason>;
}
