import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Relation, Timestamp } from "typeorm";
import { ProtototoMatch } from "./ProtototoMatch";
import { ProtototoPredictionResults } from "./ProtototoPredictionResults";

@Entity()
export class ProtototoSeason {
    @PrimaryGeneratedColumn()
    	id: number;

    @Column({ type: "timestamp" })
    	start: Date;

    @Column({ type: "timestamp" })
    	end: Date;

    @Column({ nullable: true })
    	tikkie?: string;

    @OneToMany(() => ProtototoMatch, match => match.season, { onDelete: "CASCADE" })
    	matches: Relation<ProtototoMatch[]>;

    @OneToMany(() => ProtototoPredictionResults, result => result.season, { onDelete: "CASCADE" })
    	predictionResults: Relation<ProtototoPredictionResults[]>;
}
