import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'sponsorhengel' })
export class SponsorhengelEntity {
  @PrimaryColumn({ type: 'varchar', length: 16, default: 'singleton' })
  id!: string;

  @Column({ type: 'varchar' })
  objectName!: string;

  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ type: 'varchar', length: 64, default: 'application/pdf' })
  mimeType!: string;

  @Column({ type: 'bigint' })
  byteSize!: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
