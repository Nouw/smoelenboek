import { Relation } from "typeorm";
import { Photo } from "./Photo";
export declare class Photobook {
    id: number;
    name: string;
    photos: Relation<Photo[]>;
}
