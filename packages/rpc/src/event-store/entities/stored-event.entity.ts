import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
} from 'typeorm';

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
}

