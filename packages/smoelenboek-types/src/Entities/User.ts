import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToMany,
	JoinTable,
	OneToMany, Relation,
} from "typeorm";
import { Role } from "./Role";
import { UserTeamSeason } from "./UserTeamSeason";
import { UserCommitteeSeason } from "./UserCommitteeSeason";
import { ProtototoPredictionResults } from "./ProtototoPredictionResults";
import { ProtototoPredictions } from "./ProtototoPredictions";
import { Activity } from "./Activity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    	id: number;

    @Column()
    	email: string;

    @Column({ select: false })
    	password: string;

    @Column()
    	firstName: string;

    @Column()
    	lastName: string;

    @Column()
    	streetName: string;

    @Column()
    	houseNumber: string;

    @Column()
    	postcode: string;

    @Column()
    	city: string;

    @Column()
    	phoneNumber: string;

    @Column()
    	bankaccountNumber: string;

    @Column({ type: "date" })
    	birthDate: Date;

    @Column()
    	bondNumber: string;

    @Column({ type: "date" })
    	joinDate: Date;

    @Column({ type: "date", nullable: true })
    	leaveDate?: Date;

    @Column({ nullable: true })
    	backNumber?: number;

    @Column({ nullable: true, default: "user/default.jpg" })
    	profilePicture?: string;

    @Column({ nullable: true, type: "text" })
    	refereeLicense?: string;

    @OneToMany(() => Role, (role) => role.user)
    @JoinTable()
    	roles: Relation<Role[]>;

    @OneToMany(() => UserTeamSeason, (userTeam) => userTeam.user)
    	userTeamSeason!: Relation<UserTeamSeason[]>;

    @OneToMany(() => UserCommitteeSeason, (userCommittee) => userCommittee.user)
    	userCommitteeSeason!: Relation<UserCommitteeSeason[]>;

    @OneToMany(
    	() => ProtototoPredictionResults,
    	(predictionResult) => predictionResult.user
    )
    	predictionResults!: Relation<ProtototoPredictionResults[]>;

    @OneToMany(() => ProtototoPredictions, (prediction) => prediction.user)
    	predictions!: Relation<ProtototoPredictions[]>;

    @ManyToMany(() => Activity)
    	activities: Relation<Activity[]>;
}
