import { Relation } from "typeorm";
import { UserTeamSeason } from "./UserTeamSeason";
import { UserCommitteeSeason } from "./UserCommitteeSeason";
export declare class Season {
    id: number;
    name: string;
    startDate: Date;
    endDate: Date;
    current: boolean;
    userTeamSeason: Relation<UserTeamSeason[]>;
    userCommitteeSeason: Relation<UserCommitteeSeason>;
}
