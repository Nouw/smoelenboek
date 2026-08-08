import type { PollChoiceMode } from '@repo/api';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PollOptionEntity } from './poll-option.entity';
import { PollResponseEntity } from './poll-response.entity';

@Entity({ name: 'polls' })
export class PollEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 500 })
  question!: string;

  @Column({ type: 'varchar' })
  choiceMode!: PollChoiceMode;

  @Column({ type: 'timestamptz' })
  opensAt!: Date;

  @Column({ type: 'timestamptz' })
  closesAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @OneToMany(() => PollOptionEntity, (option) => option.poll)
  options!: PollOptionEntity[];

  @OneToMany(() => PollResponseEntity, (response) => response.poll)
  responses!: PollResponseEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
