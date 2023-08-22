import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinTable, Relation } from "typeorm";
import { TeamRank, Gender } from "../Enums/Team";
import { UserTeamSeason } from "./UserTeamSeason";

@Entity()
export class Team {

  @PrimaryGeneratedColumn()
  	id: number;

  @Column()
  	name: string;

  @Column("text")
  	rank: TeamRank;

  @Column({ type: "text", nullable: true })
  	image?: string;

  @Column("text")
  	gender: Gender;

  @OneToMany(() => UserTeamSeason, userTeam => userTeam.team)
  	userTeamSeason!: Relation<UserTeamSeason[]>;
}
