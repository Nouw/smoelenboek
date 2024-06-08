import { Seeder } from "./Seeder";
// import { Permission, Role, User } from "smoelenboek-types";
import { faker, fakerNL } from "@faker-js/faker";
import { DataSource } from "typeorm";
import logger from "../Utilities/Logger";

export default class UserSeeder implements Seeder {
  name = "UserSeeder";

  async run(database: DataSource) {
    // const permission = new Permission();
    // permission.name = 'ALL';
    //     
    // const role = new Role();
    // role.name = 'Admin';
    // role.permissions = [permission]; 
    //
    // await database.manager.save(role);
    // logger.info(`Created role named: ${role.name}`);
    //
    //
    // const user = new User();
    //
    // user.email = faker.internet.email();
    // user.firstName = faker.person.firstName();
    // user.lastName = faker.person.lastName();
    // user.city = faker.location.city();
    // user.streetName = faker.location.street();
    // user.postcode = faker.location.zipCode();
    // user.houseNumber = faker.location.buildingNumber();
    // user.phoneNumber = faker.phone.number();
    // user.bankaccountNumber = fakerNL.finance.iban();
    // user.birthDate = new Date();
    // user.bondNumber = faker.string.alpha({ casing: "upper" });
    // user.profilePicture = "user/default.jpg";
    // user.refereeLicense = "VS2/V4";
    // user.password = 'TestAdmin';
    // user.roles = [role];
    //
    // await database.manager.save(user);
    //
    // logger.info(`Created user with information: Email:${user.email} ; Password:TestAdmin`);

    
    process.exit();
  }

  async revert() {}
}
