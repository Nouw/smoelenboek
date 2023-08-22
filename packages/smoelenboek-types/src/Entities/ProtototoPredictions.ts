import {
	Column,
	Entity,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
	ManyToOne, Relation,
} from "typeorm";
import { ProtototoMatch } from "./ProtototoMatch";
import { ProtototoSeason } from "./ProtototoSeason";
import { User } from "./User";

@Entity()
export class ProtototoPredictions {
    @PrimaryGeneratedColumn()
    	id: number;

    @ManyToOne(() => ProtototoMatch, (match) => match.predictions, { onDelete: "CASCADE" })
    @JoinColumn()
    	match: Relation<ProtototoMatch>;

    @ManyToOne(() => User, (user) => user.predictions)
    @JoinColumn()
    	user: Relation<User>;

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
}
