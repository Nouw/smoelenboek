import { User } from "smoelenboek-types";
import jwt from "jsonwebtoken";
import moment from "moment";

export default class AuthService {
	encryptionKey = process.env.ENCRYPTION_KEY ?? "secret";

	getTokens(user: User) {
		const authToken = jwt.sign({
			id: user.id,
			email: user.email,
			refresh: false
		}, this.encryptionKey, { expiresIn: moment().add(5, "m").unix() });

		const refreshToken = jwt.sign({
			id: user.id,
			refresh: true
		}, this.encryptionKey, { expiresIn: moment().add(6, "M").unix() });

		return { authToken, refreshToken };
	}

	decodeToken(authToken: string) {
		return jwt.verify(authToken, this.encryptionKey);
	}
}
