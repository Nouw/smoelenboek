import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { SeasonModule } from './season/season.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CommitteesModule } from './committees/committees.module';
import { DocumentsModule } from './documents/documents.module';
import { CategoriesModule } from './categories/categories.module';
import { OracleModule } from './oracle/oracle.module';
import { ProtototoModule } from './protototo/protototo.module';

import { ActivitiesModule } from './activities/activities.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { databaseSource } from './database/database-source';
import { NevoboModule } from './nevobo/nevobo.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: ['../../.env', '../../.env.local'],
    }),

    TypeOrmModule.forRoot(databaseSource),

    AuthModule,
    UsersModule,
    TeamsModule,
    SeasonModule,
    CommitteesModule,
    DocumentsModule,
    CategoriesModule,
    OracleModule,
    ProtototoModule,
    ActivitiesModule,
    MailModule,
    NevoboModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
