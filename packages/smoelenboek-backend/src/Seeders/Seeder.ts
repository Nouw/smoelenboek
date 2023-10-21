import { DataSource } from "typeorm";

export abstract class Seeder {
    name: string;

    /**
    * Runs the logic for seeding the database
    */
    abstract run(database?: DataSource): Promise<void>

    /**
     * Undo the previous run
    */
    abstract revert(): Promise<void>
}
