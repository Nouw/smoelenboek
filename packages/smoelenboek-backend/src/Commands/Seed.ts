import fs from "fs/promises"
import path from "path";
import logger from "../Utilities/Logger";
import { Seeder } from "../Seeders/Seeder";
import { Database } from "../Database";

exports.command = 'seed [name]'
exports.desc = 'Seed a record table with data'
exports.builder = {}
exports.handler = async function (argv: Map<string, unknown>) {
    await Database.initialize();
    // @ts-ignore
    const name = argv.name;

    const files = await fs.readdir(path.join(__dirname, '../Seeders/'));

    if (!files.includes(`${name}.ts`)) {
        logger.error(`Could not find seeder with name ${name}`);
        return;
    }

    const module = await import(path.join(__dirname, '../Seeders/', `${name}.ts`));

    if (module && module.default) {
        const instance: Seeder = new module.default(); 

        await instance.run(Database);
    }

    logger.info('Exited succesfully');
}
