import { Relation } from "typeorm";
import { TeamRank, Gender } from "../Enums/Team";
import { UserTeamSeason } from "./UserTeamSeason";
export declare class Team {
    id: number;
    name: string;
    rank: TeamRank;
    image?: string;
    gender: Gender;
    userTeamSeason: Relation<UserTeamSeason[]>;
}
