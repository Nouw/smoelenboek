import type { TeamRole } from '@repo/api';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'team_memberships' })
export class TeamMembershipEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  teamId!: string;

  @Column({ type: 'smallint' })
  seasonKey!: number;

  @Column({ type: 'varchar' })
  role!: TeamRole;

  @Column({ type: 'date' })
  startedOn!: string;

  @Column({ type: 'date', nullable: true })
  endedOn!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
