import { Database } from "../Database";
import { Category } from "smoelenboek-types";

export default class DocumentRepository {
	getDocumentsByCategory(id: number) {
		return Database.manager.createQueryBuilder(Category, "c")
			.innerJoinAndSelect("c.files", "f")
			.where("c.id = :id", { id })
			.getMany();
	}
}
