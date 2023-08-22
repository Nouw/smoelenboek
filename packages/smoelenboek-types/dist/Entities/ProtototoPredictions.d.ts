import { Relation } from "typeorm";
import { ProtototoMatch } from "./ProtototoMatch";
import { User } from "./User";
export declare class ProtototoPredictions {
    id: number;
    match: Relation<ProtototoMatch>;
    user: Relation<User>;
    setOne: boolean;
    setTwo: boolean;
    setThree: boolean;
    setFour: boolean;
    setFive: boolean;
}
