import { Relation } from "typeorm";
import { ProtototoMatch } from "./ProtototoMatch";
import { ProtototoPredictionResults } from "./ProtototoPredictionResults";
export declare class ProtototoSeason {
    id: number;
    start: Date;
    end: Date;
    tikkie?: string;
    matches: Relation<ProtototoMatch[]>;
    predictionResults: Relation<ProtototoPredictionResults[]>;
}
