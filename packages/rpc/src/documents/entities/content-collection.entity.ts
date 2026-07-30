import type { ContentCollectionKind } from '@repo/api';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ContentAssetEntity } from './content-asset.entity';

@Entity({ name: 'content_collections' })
export class ContentCollectionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar' })
  kind!: ContentCollectionKind;

  @Column({ type: 'smallint' })
  seasonKey!: number;

  @Column({ type: 'integer' })
  position!: number;

  @Column({ type: 'uuid', nullable: true })
  coverAssetId!: string | null;

  @OneToMany(() => ContentAssetEntity, (asset) => asset.collection)
  assets!: ContentAssetEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
