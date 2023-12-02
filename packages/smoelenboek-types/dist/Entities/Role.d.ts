import { Relation } from "typeorm";
import { User } from "./User";
import { Roles } from "../Auth/Roles";
export declare class Role {
    id: number;
    role: Roles;
    user: Relation<User>;
}
