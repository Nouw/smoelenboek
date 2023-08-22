import { Relation } from "typeorm";
import { User } from "./User";
export declare class Activity {
    id: number;
    name: string;
    location: string;
    description: string;
    date: Date;
    registrationEnd: Date;
    registrationOpen: Date;
    max: number;
    forms: string;
    formId: string;
    users: Relation<User[]>;
}
