import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { createDataSourceOptions } from './typeorm.config';

export default new DataSource(createDataSourceOptions());
