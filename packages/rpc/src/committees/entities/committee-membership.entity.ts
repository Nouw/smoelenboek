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

  @Column({ type: 'uuid' })
  seasonId!: string;

  @Column({ type: 'varchar' })
  role!: CommitteeRole;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

