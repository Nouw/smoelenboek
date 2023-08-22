import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Relation } from "typeorm";
import { User } from "./User";
import { Team } from "./Team";
import { TeamFunction } from "../Enums/Team";
import { Season } from "./Season";

@Entity()
export class UserTeamSeason {
  @PrimaryGeneratedColumn()
  	id: number;

  @Column("text")
  	function: TeamFunction;

  @ManyToOne(() => User, user => user.userTeamSeason)
  	user!: Relation<User>;

  @ManyToOne(() => Team, team => team.userTeamSeason)
  	team!: Relation<Team>;

  @ManyToOne(() => Season, season => season.userTeamSeason)
  	season!: Relation<Season>;
}
