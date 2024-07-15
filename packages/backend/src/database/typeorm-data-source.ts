import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseSource } from './database-source';

console.log(__dirname);

const datasource = new DataSource(databaseSource as DataSourceOptions); // config is one that is defined in datasource.config.ts file
datasource.initialize();
export default datasource;
