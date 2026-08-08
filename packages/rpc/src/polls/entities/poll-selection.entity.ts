import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

import { PollOptionEntity } from './poll-option.entity';
import { PollResponseEntity } from './poll-response.entity';

@Entity({ name: 'poll_selections' })
export class PollSelectionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  responseId!: string;

  @Column('uuid')
  optionId!: string;

  @ManyToOne(() => PollResponseEntity, (response) => response.selections, {
    onDelete: 'CASCADE',
  })
  response!: PollResponseEntity;

  @ManyToOne(() => PollOptionEntity, (option) => option.selections, {
    onDelete: 'CASCADE',
  })
  option!: PollOptionEntity;
}
