import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  authUserId!: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  email!: string | null;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', default: '' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  firstName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'varchar', default: 'user' })
  role!: string;

  @Column({ type: 'varchar', length: 2, default: 'nl' })
  preferredLocale!: 'nl' | 'en';

  @Column({ type: 'timestamptz', nullable: true })
  invitedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  accountActivatedAt!: Date | null;

  @Column({ type: 'boolean', default: false })
  banned!: boolean;

  @Column({ type: 'boolean', default: false })
  passwordMigrationRequired!: boolean;

  @Column({ type: 'varchar', nullable: true })
  banReason!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  banExpires!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
