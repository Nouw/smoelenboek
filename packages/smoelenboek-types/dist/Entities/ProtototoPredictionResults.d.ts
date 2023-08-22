import { Relation } from "typeorm";
import { User } from "./User";
import { ProtototoSeason } from "./ProtototoSeason";
export declare class ProtototoPredictionResults {
    id: number;
    user: Relation<User>;
    season: Relation<ProtototoSeason>;
    points: number;
}
