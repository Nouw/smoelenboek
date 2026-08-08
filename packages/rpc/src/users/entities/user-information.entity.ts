import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_information' })
export class UserInformationEntity {
  @PrimaryColumn('uuid')
  userId!: string;

  @Column({ type: 'varchar', nullable: true })
  streetName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  houseNumber!: string | null;

  @Column({ type: 'varchar', nullable: true })
  postcode!: string | null;

  @Column({ type: 'varchar', nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber!: string | null;

  @Column({ type: 'varchar', nullable: true })
  bankAccountNumber!: string | null;

  @Column({ type: 'date', nullable: true })
  birthDate!: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  bondNumber!: string | null;

  @Column({ type: 'date', nullable: true })
  leaveDate!: string | null;

  @Column({ type: 'smallint', nullable: true })
  backNumber!: number | null;

  @Column({ type: 'varchar', nullable: true })
  refereeLicense!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
