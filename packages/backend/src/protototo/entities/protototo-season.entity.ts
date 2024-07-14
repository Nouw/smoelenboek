import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { ProtototoMatch } from './protototo-match.entity';

@Entity()
export class ProtototoSeason {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  start: Date;

  @Column({ type: 'timestamp' })
  end: Date;

  @Column({ nullable: true })
  tikkie?: string;

  @OneToMany(() => ProtototoMatch, (match) => match.season, {
    onDelete: 'CASCADE',
  })
  matches: Relation<ProtototoMatch[]>;

  //@OneToMany(() => ProtototoPredictionResults, (result) => result.season, {
  //  onDelete: 'CASCADE',
  //})
  //predictionResults: Relation<ProtototoPredictionResults[]>;
}
