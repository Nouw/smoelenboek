import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { rpcEnvFilePath, validateRpcEnv } from './config/env';
import { createTypeOrmOptions } from './database/typeorm.config';
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
    UsersModule,
    TrpcModule,
  ],
})
export class AppModule {}
