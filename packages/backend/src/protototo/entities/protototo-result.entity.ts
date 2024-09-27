import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ProtototoMatch } from './protototo-match.entity';

@Entity()
export class ProtototoMatchResult {
  @PrimaryGeneratedColumn()
  id: number;

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

  @OneToOne(() => ProtototoMatch, { onDelete: 'CASCADE' })
  @JoinColumn()
  match: Relation<ProtototoMatch>;
}
