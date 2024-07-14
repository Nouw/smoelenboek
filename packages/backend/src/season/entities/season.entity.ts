import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Relation,
} from 'typeorm';
import { UserTeamSeason } from '../../teams/entities/user-team-season.entity';
import { UserCommitteeSeason } from '../../committees/entities/user-committee-season.entity';

@Entity()
export class Season {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ default: false })
  current: boolean;

  @OneToMany(() => UserTeamSeason, (userTeam) => userTeam.season)
  userTeamSeason: Relation<UserTeamSeason[]>;

  @OneToMany(() => UserCommitteeSeason, (userCommittee) => userCommittee.season)
  userCommitteeSeason: Relation<UserCommitteeSeason>;
}
