import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ContentCollectionEntity } from './content-collection.entity';

@Entity({ name: 'content_assets' })
export class ContentAssetEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  collectionId!: string;

  @ManyToOne(() => ContentCollectionEntity, (collection) => collection.assets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collectionId' })
  collection!: ContentCollectionEntity;

  @Column({ type: 'varchar' })
  objectName!: string;

  @Column({ type: 'varchar', nullable: true })
  thumbnailObjectName!: string | null;

  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ type: 'varchar', length: 160 })
  mimeType!: string;

  @Column({ type: 'bigint' })
  byteSize!: string;

  @Column({ type: 'varchar', length: 240, nullable: true })
  title!: string | null;

  @Column({ type: 'text', nullable: true })
  caption!: string | null;

  @Column({ type: 'integer' })
  position!: number;

  @Column({ type: 'uuid', nullable: true })
  uploadedBy!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
