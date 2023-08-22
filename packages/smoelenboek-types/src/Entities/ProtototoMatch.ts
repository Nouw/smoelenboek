import {
	Column,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	OneToMany, Relation,
} from "typeorm";
import { ProtototoSeason } from "./ProtototoSeason";
import { ProtototoPredictions } from "./ProtototoPredictions";

@Entity()
export class ProtototoMatch {
    @PrimaryGeneratedColumn()
    	id: number;

    @Column({ type: "timestamp" })
    	playDate: Date;

    @Column()
    	homeTeam: string;

    @Column()
    	awayTeam: string;

    @Column()
    	location: string;

    @Column()
    	gender: string;

    @ManyToOne(() => ProtototoSeason, (season) => season.matches, { onDelete: "CASCADE" })
    	season: Relation<ProtototoSeason>;

    @OneToMany(() => ProtototoPredictions, (prediction) => prediction.match)
    	predictions: Relation<ProtototoPredictions[]>;
}
