import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { UserCommitteeSeason } from "./UserCommitteeSeason";

@Entity()
export class Committee {

    @PrimaryGeneratedColumn()
    	id: number;

    @Column()
    	name: string;

    @Column({ default: true })
    	active: boolean;

    @Column({ nullable: true, type: "text" })
    	image!: string;

    @Column( {nullable: true})
    	email!: string;

    @OneToMany(() => UserCommitteeSeason, userCommittee => userCommittee.committee)
    	userCommitteeSeason!: Relation<UserCommitteeSeason>; 
}
