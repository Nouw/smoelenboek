import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { User } from "./User";
import { ProtototoSeason } from "./ProtototoSeason";

@Entity()
export class ProtototoPredictionResults {
    @PrimaryGeneratedColumn()
    	id: number;

    @ManyToOne(() => User, user => user.predictionResults)
    	user: Relation<User>;

    @ManyToOne(() => ProtototoSeason, season => season.predictionResults, { onDelete: "CASCADE" })
    	season: Relation<ProtototoSeason>;

    @Column()
    	points: number;
}
