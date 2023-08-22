import { Relation } from "typeorm";
import { ProtototoMatch } from "./ProtototoMatch";
export declare class ProtototoResults {
    id: number;
    match: Relation<ProtototoMatch>;
    setOne: boolean;
    setTwo: boolean;
    setThree: boolean;
    setFour: boolean;
    setFive: boolean;
}
