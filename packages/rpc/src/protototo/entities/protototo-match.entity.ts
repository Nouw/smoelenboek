import type { MatchFormat, SubjectSide } from '@repo/api';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ProtototoRoundEntity } from './protototo-round.entity';

@Entity({ name: 'protototo_matches' })
@Index('UQ_protototo_matches_round_nevobo', ['roundId', 'nevoboMatchId'], {
  unique: true,
})
export class ProtototoMatchEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  roundId!: string;

  @ManyToOne(() => ProtototoRoundEntity, (round) => round.matches, {
    onDelete: 'CASCADE',
  })
  round!: ProtototoRoundEntity;

  @Column('uuid')
  nevoboMatchId!: string;

  @Column()
  selectedTeamIri!: string;

  @Column()
  homeTeamIri!: string;

  @Column()
  homeTeamName!: string;

  @Column()
  awayTeamIri!: string;

  @Column()
  awayTeamName!: string;

  @Column()
  subjectSide!: SubjectSide;

  @Column()
  format!: MatchFormat;

  @Column()
  pointMethodIri!: string;

  @Column({ type: 'timestamptz' })
  startsAt!: Date;

  @Column({ type: 'boolean', array: true, nullable: true })
  resultSetWinners!: boolean[] | null;

  @Column({ type: 'varchar', nullable: true })
  resultStatus!: 'pending' | 'final' | 'cancelled' | null;

  @Column({ type: 'timestamptz', nullable: true })
  resultSyncedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncAttemptAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  lastSyncError!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  removedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
