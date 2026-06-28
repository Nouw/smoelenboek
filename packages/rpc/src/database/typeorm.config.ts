import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';

import { StoredEventEntity } from '../event-store/entities/stored-event.entity';
import { SeasonEntity } from '../seasons/entities/season.entity';
import { UserEntity } from '../users/entities/user.entity';

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for packages/rpc.');
  }

  return databaseUrl;
}

export function createDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  return {
    type: 'postgres',
    url: getDatabaseUrl(env),
    entities: [SeasonEntity, StoredEventEntity, UserEntity],
    migrations: [`${__dirname}/migrations/*{.ts,.js}`],
    synchronize: false,
  };
}

export function createTypeOrmOptions(
  env: NodeJS.ProcessEnv = process.env,
): TypeOrmModuleOptions {
  return {
    ...createDataSourceOptions(env),
    autoLoadEntities: true,
  };
}
