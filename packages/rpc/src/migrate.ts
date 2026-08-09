import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { loadRpcEnv } from './config/env';
import { createDataSourceOptions } from './database/typeorm.config';

loadRpcEnv();

async function main() {
  const ds = new DataSource(createDataSourceOptions());
  await ds.initialize();
  const migrations = await ds.runMigrations({ transaction: 'all' });
  await ds.destroy();
  console.log(`Ran ${migrations.length} migration(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
