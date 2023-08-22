import { Relation } from "typeorm";
import { ProtototoSeason } from "./ProtototoSeason";
import { ProtototoPredictions } from "./ProtototoPredictions";
export declare class ProtototoMatch {
    id: number;
    playDate: Date;
    homeTeam: string;
    awayTeam: string;
    location: string;
    gender: string;
    season: Relation<ProtototoSeason>;
    predictions: Relation<ProtototoPredictions[]>;
}
