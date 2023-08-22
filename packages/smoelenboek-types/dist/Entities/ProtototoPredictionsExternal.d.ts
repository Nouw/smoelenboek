import { Relation } from "typeorm";
import { ProtototoMatch } from "./ProtototoMatch";
export declare class ProtototoPredictionsExternal {
    id: number;
    match: Relation<ProtototoMatch>;
    firstName: string;
    lastName: string;
    email: string;
    setOne: boolean;
    setTwo: boolean;
    setThree: boolean;
    setFour: boolean;
    setFive: boolean;
}
