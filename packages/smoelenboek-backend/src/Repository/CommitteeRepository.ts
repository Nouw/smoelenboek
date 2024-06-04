import { Database } from "../Database";
import { Committee, User, UserCommitteeSeason } from "smoelenboek-types";
import SeasonRepository from "./SeasonRepository";

export default class CommitteeRepository {
	private seasonRepository = new SeasonRepository();

	all(active = true) {
		return Database.manager.find(Committee, {
			where: {
				active
			}
		});
	}

	async info(id: number) {
		const season = await this.seasonRepository.getCurrentSeason();

		return Database.manager.createQueryBuilder(UserCommitteeSeason, "ucs")
			.select(["ucs", "u.id", "u.firstName", "u.lastName", "u.profilePicture", "c.name", "c.email", "c.image"])
			.innerJoin("ucs.user", "u")
			.innerJoin("ucs.committee", "c")
			.where("ucs.committee.id = :committeeId", { committeeId: id })
			.andWhere("ucs.season.id = :id", { id: season.id })
			.getMany();
	}

	async getCommitteeById(id: string | number) {
		return Database.manager.findOne(Committee, { where: { id: typeof id == "string" ? parseInt(id) : id } });
	}

  async getCommitteesForUser(user: User) {
    const season = await this.seasonRepository.getCurrentSeason();
    return Database.manager.createQueryBuilder(UserCommitteeSeason, "ucs")
      .select(["ucs", "c"])
      .innerJoin("ucs.committee", "c")
      .where("ucs.user.id = :userId", { userId: user.id })
      .andWhere("ucs.season.id = :seasonId", { seasonId: season.id })
      .getMany(); 
  }
}
