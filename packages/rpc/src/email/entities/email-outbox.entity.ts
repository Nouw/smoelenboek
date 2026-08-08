import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type EmailLocale = 'nl' | 'en';
export type EmailOutboxStatus = 'pending' | 'sending' | 'sent' | 'failed';
export type EmailMessageType = 'invitation' | 'password_reset' | 'email_verification' | 'address_update' | 'bankaccount_update';

@Entity({ name: 'email_outbox' })
export class EmailOutboxEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 64 }) messageType!: EmailMessageType;
  @Column({ type: 'varchar', length: 320 }) recipient!: string;
  @Column({ type: 'varchar', length: 2, default: 'nl' }) locale!: EmailLocale;
  @Column({ type: 'jsonb' }) payload!: Record<string, unknown>;
  @Column({ type: 'uuid', nullable: true }) relatedUserId!: string | null;
  @Column({ type: 'varchar', length: 255, unique: true }) deduplicationKey!: string;
  @Column({ type: 'varchar', length: 16, default: 'pending' }) status!: EmailOutboxStatus;
  @Column({ type: 'int', default: 0 }) attempts!: number;
  @Column({ type: 'timestamptz', default: () => 'now()' }) nextAttemptAt!: Date;
  @Column({ type: 'text', nullable: true }) lastError!: string | null;
  @Column({ type: 'timestamptz', nullable: true }) sentAt!: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
