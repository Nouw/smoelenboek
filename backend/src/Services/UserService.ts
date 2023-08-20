import { Database } from "../Database";
import { User } from "smoelenboek-types";
import bcrypt from "bcrypt";

export default class UserService {
	async checkPassword(email: string, password: string) {
		const user = await Database.manager.findOne(User, { select: { id: true, email: true, password: true }, where: { email } });

		if (!user) {
			return Promise.reject(Error("User not found"));
		}

		const match = bcrypt.compare(password, user.password);

		if (!match) {
			return Promise.reject(Error("Password does not match"));
		}

		return user;
	}

	generatePassword() {
		return (Math.random() + 1).toString(36).substring(5);
	}
}
