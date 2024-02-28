import { DataSource } from "typeorm";
import { Seeder } from "./Seeder";
import { Role, Roles, User } from "smoelenboek-types";

export default class UserRoleSeeder implements Seeder {
	name = "UserRoleSeeder";

	async run(database: DataSource) {
		const users = await database.manager.find(User);
		console.log(database.options.database)
		const rows: Role[] = [];

		for (const user of users) {
			const role = new Role();
			role.role = Roles.USER;
			role.user = user;

			rows.push(role);	
		}

		await database.manager.save(rows);
	}

	async revert(database: DataSource) {
		await database.manager.delete(Role, { role: Roles.USER });
	}
} 
