import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { rpcEnvFilePath, validateRpcEnv } from './config/env';
import { createTypeOrmOptions } from './database/typeorm.config';
import { EventStoreModule } from './event-store/event-store.module';
import { SeasonsModule } from './seasons/seasons.module';
import { TrpcModule } from './trpc/trpc.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: rpcEnvFilePath,
      isGlobal: true,
      validate: validateRpcEnv,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => createTypeOrmOptions(),
    }),
    CqrsModule.forRoot(),
    AuthModule,
    EventStoreModule,
    SeasonsModule,
    UsersModule,
    TrpcModule,
  ],
})
export class AppModule {}
