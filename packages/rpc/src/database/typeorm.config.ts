import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';

import { CommitteeMembershipEntity } from '../committees/entities/committee-membership.entity';
import { CommitteeEntity } from '../committees/entities/committee.entity';
import { StoredEventEntity } from '../event-store/entities/stored-event.entity';
import { TeamMembershipEntity } from '../teams/entities/team-membership.entity';
import { TeamEntity } from '../teams/entities/team.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UserInformationEntity } from '../users/entities/user-information.entity';

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
    entities: [
      CommitteeEntity,
      CommitteeMembershipEntity,
      StoredEventEntity,
      TeamEntity,
      TeamMembershipEntity,
      UserInformationEntity,
      UserEntity,
    ],
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
