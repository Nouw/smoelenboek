import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Relation,
} from 'typeorm';
import { TeamFunction } from '../enums/team-rank.enum';
import { Season } from '../../season/entities/season.entity';
import { User } from '../../users/entities/user.entity';
import { Team } from './team.entity';

@Entity()
export class UserTeamSeason {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  function: TeamFunction;

  @ManyToOne(() => User, (user) => user.userTeamSeason)
  user!: Relation<User>;

  @ManyToOne(() => Team, (team) => team.userTeamSeason)
  team!: Relation<Team>;

  @ManyToOne(() => Season, (season) => season.userTeamSeason)
  season!: Relation<Season>;
}
