import { Relation } from "typeorm";
import { User } from "./User";
import { Team } from "./Team";
import { TeamFunction } from "../Enums/Team";
import { Season } from "./Season";
export declare class UserTeamSeason {
    id: number;
    function: TeamFunction;
    user: Relation<User>;
    team: Relation<Team>;
    season: Relation<Season>;
}
