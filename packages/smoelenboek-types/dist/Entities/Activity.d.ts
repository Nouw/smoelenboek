import { Relation } from "typeorm";
import { User } from "./User";
import { Form } from "./Form";
import { Committee } from "./Committee";
export declare class Activity {
    id: number;
    title: string;
    description: string;
    location: string;
    date: Date;
    registrationOpen: Date;
    registrationClosed: Date;
    max: number;
    public: boolean;
    commitee: Committee;
    form: Relation<Form>;
    users: Relation<User[]>;
}
