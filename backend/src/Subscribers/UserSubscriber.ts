import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from "typeorm";
import { User } from "smoelenboek-types";
import { Table } from "mailgen";
import Mail from "../Utilities/Mail";
import bcrypt from "bcrypt";

@EventSubscriber()
export default class UserSubscriber implements EntitySubscriberInterface<User> {
	listenTo() {
		return User;
	}

	beforeInsert(event: InsertEvent<User>): Promise<User> | void {
		event.entity.password = bcrypt.hashSync(event.entity.password, 10);
		event.entity.joinDate = new Date();
	}

	afterUpdate(event: UpdateEvent<User>): Promise<User> | void {
		const table = { data: [] } as Table;

		for (const column of event.updatedColumns) {
			table.data.push({
				"Oude waarde": event.databaseEntity[column.propertyPath],
				"Nieuwe waarde": event.entity[column.propertyPath]
			});
		}

		const mail = new Mail(`[Smoelenboek] Gegevens zijn aangepast van ${event.entity.firstName}`, "offabio@outlook.com");

		mail.addIntro(`${event.entity.firstName} ${event.entity.lastName} heeft zijn/haar gegevens aangepast, hieronder zijn de aanpassingen te vinden:`)
			.addTable(table)
			.addGreeting("Beste secretaris")
			.send();

		return undefined;
	}
}
