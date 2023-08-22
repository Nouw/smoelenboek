import { Relation } from "typeorm";
import { File } from "./File";
export declare enum CategoryType {
    CATEGORY_TYPE_DOCUMENTS = "documents",
    CATEGORY_TYPE_PHOTOS = "photos"
}
export declare class Category {
    id: number;
    name: string;
    pinned: boolean;
    type: CategoryType;
    created: Date;
    files: Relation<File[]>;
}
