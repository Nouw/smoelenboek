import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { User } from "./User";
import { Committee } from "./Committee";
import { Season } from "./Season";

@Entity()
export class UserCommitteeSeason {
    @PrimaryGeneratedColumn()
    	id: number;

    @Column("text")
    	function: string;

    @ManyToOne(() => User, user => user.userCommitteeSeason, { onDelete: "CASCADE" })
    	user: Relation<User>;

    @ManyToOne(() => Committee, committee => committee.userCommitteeSeason, { onDelete: "CASCADE" })
    	committee!: Relation<Committee>;

    @ManyToOne(() => Season, season => season.userCommitteeSeason)
    	season!: Relation<Season>;
}
