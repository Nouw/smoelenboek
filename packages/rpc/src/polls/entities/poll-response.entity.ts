import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { PollEntity } from './poll.entity';
import { PollSelectionEntity } from './poll-selection.entity';

@Entity({ name: 'poll_responses' })
export class PollResponseEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  pollId!: string;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => PollEntity, (poll) => poll.responses, {
    onDelete: 'CASCADE',
  })
  poll!: PollEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user!: UserEntity;

  @OneToMany(() => PollSelectionEntity, (selection) => selection.response)
  selections!: PollSelectionEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  submittedAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
