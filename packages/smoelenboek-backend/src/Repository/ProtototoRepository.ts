import moment from "moment";
import { Database } from "../Database";
import {
	ProtototoSeason,
	ProtototoMatch,
	ProtototoPredictions,
	ProtototoPredictionsExternal,
	ProtototoResults
} from "smoelenboek-types";

interface Prediction {
  name: string,
  email: string,
  matches: any,
  score: number,
}


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

	async GetPlayersForSeason(id: number) {
		const season = await Database.manager.findOneBy(ProtototoSeason, { id });

		const matches = await this.getMatches(false, season.id);

		let predictions: Prediction[] = [];

		for (const match of matches) {
			const predictionsUsers = await Database.manager.createQueryBuilder(ProtototoPredictions, "pred")
				.select(["user.firstName", "user.lastName", "pred.setOne", "pred.setTwo", "pred.setThree", "pred.setFour", "pred.setFive", "match.id"])
				.innerJoin("pred.user", "user")
				.innerJoin("pred.match", "match")
				.where("pred.matchId = :id", { id: match.id })
				.getMany();

			const predictionsExternal = await Database.manager.createQueryBuilder(ProtototoPredictionsExternal, "pred")
				.where("pred.matchId = :id", { id: match.id })
				.getMany();

			for (const prediction of predictionsExternal) {
				predictions = this.createPrediction(predictions, prediction.firstName, prediction.lastName, prediction.email, match.id, prediction.setOne, prediction.setTwo, prediction.setThree, prediction.setFour, prediction.setFive);
			}

			for (const prediction of predictionsUsers) {
				predictions = this.createPrediction(predictions, prediction.user.firstName, prediction.user.lastName, prediction.user.email,
					match.id, prediction.setOne, prediction.setTwo, prediction.setThree, prediction.setFour, prediction.setFive
				)
				;
			}
		}

		for (const prediction of predictions) {
			let score = prediction.score;

			for (const match of prediction.matches) {
				const result = await Database.manager.createQueryBuilder(ProtototoResults, "result")
					.where("result.matchId = :id", { id: match.id }).getOne();

				if (!result) {
					break;
				}

				score++;

				if (result.setOne === match.setOne) {
					score++;
				}

				if (result.setTwo === match.setTwo) {
					score++;
				}

				if (result.setThree === match.setThree) {
					score++;
				}

				if (result.setFour === match.setFour && result.setFour !== null) {
					score++;
				}

				if (result.setFive !== null) {
					if (result.setFive === match.setFive) {
						score++;
					}

					if (result.setOne === match.setOne && result.setTwo === match.setTwo && result.setThree === match.setThree && result.setFour === match.setFour && result.setFive === match.setFive) {
						score += 3;
					}
				}
			}

			prediction.score = score;
		}

		predictions = predictions.sort((a, b) => b.score - a.score);

		return predictions;
	}

	private createPrediction(predictions: Prediction[], firstName: string, lastName: string, email: string, matchId: number, setOne: boolean, setTwo: boolean, setThree: boolean, setFour: boolean, setFive: boolean) {
		const index = predictions.findIndex((x) => x.name === `${firstName} ${lastName}`);

		const matchPrediction = {
			id: matchId,
			setOne,
			setTwo,
			setThree,
			setFour
		};

		if (index >= 0) {
			predictions[index].matches.push(matchPrediction);
		} else {
			predictions.push({
				email,
				name: `${firstName} ${lastName}`,
				score: 0,
				matches: [matchPrediction]
			});
		}

		return predictions;
	}
}
