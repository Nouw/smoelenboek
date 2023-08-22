import { Relation } from "typeorm";
import { Permission } from "./Permission";
import { User } from "./User";
export declare enum Roles {
    DEFAULT = 1,
    ADMIN = 2,
    TEMP = 3
}
export declare class Role {
    id: number;
    name: string;
    users: Relation<User[]>;
    permissions: Relation<Permission[]>;
}
