import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Propoll } from './propoll.entity';
import { PropollVote } from './propoll-vote.entity';

@Entity()
export class PropollOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  text: string;

  @Column()
  pollId: number;

  @ManyToOne(() => Propoll, (poll) => poll.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pollId' })
  poll: Relation<Propoll>;

  @OneToMany(() => PropollVote, (vote) => vote.option)
  votes: Relation<PropollVote[]>;
}
