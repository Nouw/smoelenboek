import { Relation } from "typeorm";
import { UserCommitteeSeason } from "./UserCommitteeSeason";
export declare class Committee {
    id: number;
    name: string;
    active: boolean;
    image: string;
    email: string;
    userCommitteeSeason: Relation<UserCommitteeSeason>;
}
