import { Database } from "../Database";
import { User } from "smoelenboek-types";
import bcrypt from "bcrypt";
import exceljs from "exceljs";
import moment from "moment";
import path from "path";
import { IsNull } from "typeorm";

export default class UserService {
  async checkPassword(email: string, password: string) {
    const user = await Database.manager.findOne(User, {
      select: { id: true, email: true, password: true },
      where: { email },
    });

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

  async exportToExcel() {
    const users = await Database.manager.find(User, {
      select: [
        "firstName",
        "lastName",
        "email",
        "streetName",
        "houseNumber",
        "city",
        "postcode",
        "phoneNumber",
        "birthDate",
      ],
      where: {
        leaveDate: IsNull(),
      },
    });

    const workbook = new exceljs.Workbook();
    workbook.creator = "Smoelenboek";

    const worksheet = workbook.addWorksheet("Leden");

    worksheet.columns = [
      "Voornaam",
      "Achternaam",
      "E-mail",
      "Straatnaam",
      "Huisnummer",
      "Plaats",
      "Postcode",
      "Telefoonnummer",
      "Geboortedatum",
    ];

    for (const user of users) {
      worksheet.addRow([
        user.firstName,
        user.lastName,
        user.email,
        user.streetName,
        user.houseNumber,
        user.city,
        user.postcode,
        user.phoneNumber,
        moment(user.birthDate).format("DD-MM-YYYY"),
      ]);
    }

		const location = path.join(__dirname, "../../public/temp/export.xlsx");

		await workbook.xlsx.writeFile(location);

		return location;
	}
}
