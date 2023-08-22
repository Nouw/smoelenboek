import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Role } from "./Role";

@Entity()
export class Permission {
	@PrimaryGeneratedColumn()
		id: number;

	@Column({ unique: true })
		name: string;

	@ManyToMany(() => Role, role => role.permissions)
		roles: Relation<Role[]>;
}
