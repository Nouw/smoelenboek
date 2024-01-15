import { Relation } from "typeorm";
import { Activity } from "./Activity";
import { FormQuestion } from "./FormQuestion";
export declare class Form {
    id: string;
    title: string;
    description?: string;
    activity: Relation<Activity>;
    questions: Relation<FormQuestion[]>;
}
