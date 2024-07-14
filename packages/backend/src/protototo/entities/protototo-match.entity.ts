import { TeamRank } from 'src/teams/enums/team-rank.enum';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ProtototoSeason } from './protototo-season.entity';
import { ProtototoPrediction } from './protototo-prediction.entity';

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
}
