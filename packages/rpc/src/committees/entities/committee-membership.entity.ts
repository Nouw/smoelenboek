import type { CommitteeRole } from '@repo/api';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'committee_memberships' })
export class CommitteeMembershipEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  committeeId!: string;

  @Column({ type: 'smallint' })
  seasonKey!: number;

  @Column({ type: 'varchar' })
  role!: CommitteeRole;

  @Column({ type: 'date' })
  startedOn!: string;

  @Column({ type: 'date', nullable: true })
  endedOn!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
