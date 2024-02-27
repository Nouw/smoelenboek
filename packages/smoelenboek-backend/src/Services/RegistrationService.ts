import { FormAnswer, FormAnswerValue } from "smoelenboek-types";
import { Database } from "../Database";

export default class RegistrationService {
	getAnonymousRegistrations(email: string) {
		return Database.manager.find(FormAnswer, {
			relations: {
				form: {
					activity: true
				}
			},
			where: {
				email
			}
		}) 
	}
	
	async getUserRegistrations(id: number): Promise<Record<string, FormAnswerValue[]>> {
		const registrations = await Database.manager.find(FormAnswer, {
			relations: {
				form: {
					activity: true
				}
			},
			where: {
				user: { id }
			}
		});
		console.log(registrations);
		let result: Record<string, FormAnswerValue[]> = {};

		for (const registration of registrations) {
			result[registration.form.activity.id] = registration.values
		}

		return result; 
	}
}
