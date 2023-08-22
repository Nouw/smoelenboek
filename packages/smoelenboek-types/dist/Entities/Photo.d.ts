import { Relation } from "typeorm";
import { Photobook } from "./Photobook";
export declare class Photo {
    id: number;
    file: string;
    photobook: Relation<Photobook>;
}
