import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ProtototoMatch } from './protototo-match.entity';

@Entity()
export class ProtototoPredictionExternal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProtototoMatch, (match) => match.predictions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  match: Relation<ProtototoMatch>;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

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
