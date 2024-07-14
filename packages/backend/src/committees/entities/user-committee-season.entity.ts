import { User } from '../../users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Committee } from './committee.entity';
import { Season } from '../../season/entities/season.entity';
import { CommitteeFunction } from '../enums/committee-function.enum';

@Entity()
export class UserCommitteeSeason {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: CommitteeFunction.Commissielid })
  function: CommitteeFunction;

  @ManyToOne(() => User, (user) => user.userCommitteeSeason, {
    onDelete: 'CASCADE',
  })
  user: Relation<User>;

  @ManyToOne(() => Committee, (committee) => committee.userCommitteeSeason, {
    onDelete: 'CASCADE',
  })
  committee: Relation<Committee>;

  @ManyToOne(() => Season, (season) => season.userCommitteeSeason)
  season: Relation<Season>;
}
