import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Propoll } from './propoll.entity';
import { PropollOption } from './propoll-option.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class PropollVote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pollId: number;

  @ManyToOne(() => Propoll, (poll) => poll.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pollId' })
  poll: Relation<Propoll>;

  @Column()
  optionId: number;

  @ManyToOne(() => PropollOption, (option) => option.votes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'optionId' })
  option: Relation<PropollOption>;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.propollVotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;
}
