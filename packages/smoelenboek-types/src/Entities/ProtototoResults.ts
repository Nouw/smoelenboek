import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { ProtototoMatch } from "./ProtototoMatch";

@Entity()
export class ProtototoResults {
    @PrimaryGeneratedColumn()
    	id: number;

    @OneToOne(() => ProtototoMatch, { onDelete: "CASCADE" })
    @JoinColumn()
    	match: Relation<ProtototoMatch>;

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
