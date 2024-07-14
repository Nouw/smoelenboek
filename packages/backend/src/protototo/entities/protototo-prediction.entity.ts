import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ProtototoMatch } from './protototo-match.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class ProtototoPrediction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProtototoMatch, (match) => match.predictions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  match: Relation<ProtototoMatch>;

  @ManyToOne(() => User, (user) => user.predictions)
  @JoinColumn()
  user: Relation<User>;

  @Column()
  setOne: boolean;

  @Column()
  setTwo: boolean;

  @Column()
  setThree: boolean;

  @Column({ nullable: true })
  setFour: boolean;

  @Column({ nullable: true })
  setFive: boolean;
}
