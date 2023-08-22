import { Relation } from "typeorm";
import { Category } from "./Category";
export declare class File {
    id: number;
    path: string;
    category: Relation<Category>;
}
