import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ProtototoEntryEntity } from './protototo-entry.entity';
import { ProtototoMatchEntity } from './protototo-match.entity';

@Entity({ name: 'protototo_predictions' })
@Index('UQ_protototo_predictions_entry_match', ['entryId', 'matchId'], {
  unique: true,
})
export class ProtototoPredictionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  entryId!: string;

  @ManyToOne(() => ProtototoEntryEntity, (entry) => entry.predictions, {
    onDelete: 'CASCADE',
  })
  entry!: ProtototoEntryEntity;

  @Column('uuid')
  matchId!: string;

  @ManyToOne(() => ProtototoMatchEntity, { onDelete: 'CASCADE' })
  match!: ProtototoMatchEntity;

  @Column({ type: 'boolean', array: true })
  setWinners!: boolean[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
