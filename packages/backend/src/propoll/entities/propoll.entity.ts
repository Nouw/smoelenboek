import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { PropollOption } from './propoll-option.entity';
import { PropollVote } from './propoll-vote.entity';

@Entity()
export class Propoll {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  question: string;

  @Column({ default: false })
  allowMultiple: boolean;

  @Column({ type: 'datetime', nullable: true })
  voteStartAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  voteEndAt: Date | null;

  @OneToMany(() => PropollOption, (option) => option.poll, { cascade: true })
  options: Relation<PropollOption[]>;

  @OneToMany(() => PropollVote, (vote) => vote.poll)
  votes: Relation<PropollVote[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
