import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type DispatchStatus = 'pending' | 'dispatching' | 'dispatched' | 'failed';

@Entity({ name: 'stored_events' })
export class StoredEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'bigint', unique: true })
  @Generated('increment')
  sequence!: string;

  @Column()
  aggregateType!: string;

  @Column()
  aggregateId!: string;

  @Column()
  eventType!: string;

  @Column({ type: 'integer' })
  eventVersion!: number;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  occurredAt!: Date;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  dispatchStatus!: DispatchStatus;

  @Column({ type: 'integer', default: 0 })
  dispatchAttempts!: number;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  nextDispatchAt!: Date;

  @Column({ type: 'text', nullable: true })
  lastDispatchError!: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

