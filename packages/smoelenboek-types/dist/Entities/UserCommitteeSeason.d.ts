import { Relation } from "typeorm";
import { User } from "./User";
import { Committee } from "./Committee";
import { Season } from "./Season";
export declare class UserCommitteeSeason {
    id: number;
    function: string;
    user: Relation<User>;
    committee: Relation<Committee>;
    season: Relation<Season>;
}
