import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ProtototoMatchEntity } from './protototo-match.entity';

@Entity({ name: 'protototo_rounds' })
export class ProtototoRoundEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'timestamptz' })
  opensAt!: Date;

  @Column({ type: 'timestamptz' })
  closesAt!: Date;

  @Column({ type: 'varchar', nullable: true })
  tikkieUrl!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @OneToMany(() => ProtototoMatchEntity, (match) => match.round)
  matches!: ProtototoMatchEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
