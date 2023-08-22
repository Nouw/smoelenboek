import { Relation } from "typeorm";
import { Role } from "./Role";
export declare class Permission {
    id: number;
    name: string;
    roles: Relation<Role[]>;
}
