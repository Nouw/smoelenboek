import { TeamRank } from '../../teams/enums/team-rank.enum';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ProtototoSeason } from './protototo-season.entity';
import { ProtototoPrediction } from './protototo-prediction.entity';
import { ProtototoMatchResult } from './protototo-result.entity';
import { ProtototoPredictionExternal } from './protototo-prediction-external.entity';

@Entity()
export class ProtototoMatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nevoboId: string;

  @Column({ nullable: true })
  homeTeam?: string;

  @Column({ nullable: true })
  awayTeam?: string;

  @Column()
  rank: TeamRank;

  @ManyToOne(() => ProtototoSeason, (season) => season.matches, {
    onDelete: 'CASCADE',
  })
  season: Relation<ProtototoSeason>;

  @OneToMany(() => ProtototoPrediction, (prediction) => prediction.match)
  predictions: Relation<ProtototoPrediction[]>;

  @OneToMany(
    () => ProtototoPredictionExternal,
    (prediction) => prediction.match,
  )
  externalPredictions: Relation<ProtototoPredictionExternal[]>;

  @OneToOne(() => ProtototoMatchResult, (result) => result.match)
  result: Relation<ProtototoMatchResult>;
}
