import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Relation,
} from 'typeorm';
import { TeamRank, Gender } from '../enums/team-rank.enum';
import { UserTeamSeason } from './user-team-season.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  league: TeamRank;

  @Column({ type: 'text', nullable: true })
  image?: string;

  @Column('text')
  gender: Gender;

  @OneToMany(() => UserTeamSeason, (userTeam) => userTeam.team)
  userTeamSeason!: Relation<UserTeamSeason[]>;

  constructor(name?: string, rank?: TeamRank, gender?: Gender) {
    this.name = name;
    this.league = rank;
    this.gender = gender;
  }
}
