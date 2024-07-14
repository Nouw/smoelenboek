import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity()
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  path: string;

  @Column({ nullable: true })
  originalName: string;

  @ManyToOne(() => Category, (category) => category.documents)
  category: Relation<Category>;
}
