import {
  AfterInsert,
  Column,
  CreateDateColumn,
  Entity,
  getRepository,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { CategoryType } from '../enums/catagory-type.enum';
import { Document } from '../../documents/entities/document.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: CategoryType.Photos })
  type: CategoryType;

  @Column({ default: 0 })
  key: number;

  @CreateDateColumn()
  created: Date;

  @OneToMany(() => Document, (doc) => doc.category, { onDelete: 'CASCADE' })
  documents: Relation<File[]>;
}
