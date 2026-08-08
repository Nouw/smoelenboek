import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { CommitteesModule } from './committees/committees.module';
import { rpcEnvFilePath, validateRpcEnv } from './config/env';
import { createTypeOrmOptions } from './database/typeorm.config';
import { EventStoreModule } from './event-store/event-store.module';
import { EmailModule } from './email/email.module';
import { DocumentsModule } from './documents/documents.module';
import { MediaModule } from './media/media.module';
import { MembershipsModule } from './memberships/memberships.module';
import { ProtototoModule } from './protototo/protototo.module';
import { PollsModule } from './polls/polls.module';
import { SeasonsModule } from './seasons/seasons.module';
import { TeamsModule } from './teams/teams.module';
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
    ScheduleModule.forRoot(),
    AuthModule,
    CommitteesModule,
    DocumentsModule,
    EventStoreModule,
    EmailModule,
    MediaModule,
    MembershipsModule,
    PollsModule,
    ProtototoModule,
    SeasonsModule,
    TeamsModule,
    UsersModule,
    TrpcModule,
  ],
})
export class AppModule {}
