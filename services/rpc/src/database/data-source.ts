import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { loadRpcEnv } from '../config/env';
import { createDataSourceOptions } from './typeorm.config';

loadRpcEnv();

export default new DataSource(createDataSourceOptions());
