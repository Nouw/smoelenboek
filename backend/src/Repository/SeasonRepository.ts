import { Database } from "../Database";
import { Season } from "smoelenboek-types";
import moment from "moment";

export default class SeasonRepository {
	getCurrentSeason() {
		const now = moment().format("YYYY-MM-DD");

		return Database.createQueryBuilder(Season, "s").where(`s.startDate <= '${now}' AND s.endDate > '${now}'`).getOne();
	}
}
