import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ProtototoPredictionEntity } from './protototo-prediction.entity';

@Entity({ name: 'protototo_entries' })
@Index('UQ_protototo_entries_member', ['roundId', 'userId'], {
  unique: true,
  where: '"userId" IS NOT NULL',
})
@Index('UQ_protototo_entries_anonymous', ['roundId', 'emailNormalized'], {
  unique: true,
  where: '"emailNormalized" IS NOT NULL',
})
@Check(
  'CHK_protototo_entries_identity',
  `("participantType" = 'member' AND "userId" IS NOT NULL AND "email" IS NULL AND "emailNormalized" IS NULL AND "firstNameNormalized" IS NULL)
   OR ("participantType" = 'anonymous' AND "userId" IS NULL AND "email" IS NOT NULL AND "emailNormalized" IS NOT NULL AND "firstNameNormalized" IS NOT NULL)`,
)
export class ProtototoEntryEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  roundId!: string;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column()
  participantType!: 'member' | 'anonymous';

  @Column()
  firstName!: string;

  @Column({ type: 'varchar', nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', nullable: true })
  emailNormalized!: string | null;

  @Column({ type: 'varchar', nullable: true })
  firstNameNormalized!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paymentClaimedAt!: Date | null;

  @OneToMany(() => ProtototoPredictionEntity, (prediction) => prediction.entry)
  predictions!: ProtototoPredictionEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  submittedAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
