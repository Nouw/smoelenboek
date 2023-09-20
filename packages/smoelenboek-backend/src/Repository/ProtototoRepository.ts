import moment from "moment";
import { Database } from "../Database";
import { ProtototoSeason, ProtototoMatch, ProtototoPredictions, ProtototoPredictionsExternal } from "smoelenboek-types";

export default class ProtototoRepository {
	getCurrentSeason() {
		const now = moment().format("YYYY-MM-DD HH:mm:ss");

		return Database
			.createQueryBuilder(ProtototoSeason, "s")
			.where(`s.start <= '${now}' AND s.end > '${now}'`)
			.getOne();
	}

	async getMatches(current = false, season?: number) {
		if (current) {
			const season = await this.getCurrentSeason();

			return Database.createQueryBuilder(ProtototoMatch, "match")
				.select(["match", "season.id"])
				.innerJoin("match.season", "season")
				.where("match.season.id = :id", { id: season.id })
				.andWhere("match.playDate >= :now", { now: new Date().toISOString() })
				.orderBy("match.playDate", "ASC")
				.getMany();
		}

		return Database.createQueryBuilder(ProtototoMatch, "match")
			.select([
				"match.id",
				"match.playDate",
				"match.homeTeam",
				"match.awayTeam",
				"match.gender",
			])
			.where("match.season.id = :id", { id: season })
			.getMany();
	}

	getPrediction(user: number, match: number) {
		return Database.createQueryBuilder(ProtototoPredictions, "prediction")
			.select(["prediction"])
			.where("prediction.user.id = :userId", { userId: user })
			.andWhere("prediction.match.id = :matchId", {
				matchId: match,
			})
			.getOne();
	}

	GetExternalPrediction(firstName: string, lastName: string, email: string, id: number) {
		return Database.createQueryBuilder(ProtototoPredictionsExternal, "ppe")
			.where("ppe.firstName = :firstName", { firstName })
			.andWhere("ppe.lastName = :lastName", { lastName })
			.andWhere("ppe.email = :email", { email })
			.andWhere("ppe.match.id = :id", { id })
			.getOne();
	}

}
