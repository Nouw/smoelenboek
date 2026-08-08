import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';

import { PollEntity } from './poll.entity';
import { PollSelectionEntity } from './poll-selection.entity';

@Entity({ name: 'poll_options' })
export class PollOptionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  pollId!: string;

  @Column({ type: 'varchar', length: 200 })
  label!: string;

  @Column({ type: 'smallint' })
  position!: number;

  @ManyToOne(() => PollEntity, (poll) => poll.options, { onDelete: 'CASCADE' })
  poll!: PollEntity;

  @OneToMany(() => PollSelectionEntity, (selection) => selection.option)
  selections!: PollSelectionEntity[];
}
