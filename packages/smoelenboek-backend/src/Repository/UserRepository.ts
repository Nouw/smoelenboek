import { Database } from "../Database";
import { User } from "smoelenboek-types";

export default class UserRepository {
	async getUserById(id: string | number) {
		return Database.manager.findOne(User, { where: { id: typeof id == "string" ? parseInt(id) : id } });
	}
}
