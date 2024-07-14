import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { SeasonModule } from './season/season.module';
import { Team } from './teams/entities/team.entity';
import { UserTeamSeason } from './teams/entities/user-team-season.entity';
import { Season } from './season/entities/season.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { CommitteesModule } from './committees/committees.module';
import { Committee } from './committees/entities/committee.entity';
import { UserCommitteeSeason } from './committees/entities/user-committee-season.entity';
import { DocumentsModule } from './documents/documents.module';
import { Category } from './categories/entities/category.entity';
import { Document } from './documents/entities/document.entity';
import { CategoriesModule } from './categories/categories.module';
import { OracleModule } from './oracle/oracle.module';
import { ProtototoModule } from './protototo/protototo.module';
import { ProtototoSeason } from './protototo/entities/protototo-season.entity';
import { ProtototoMatch } from './protototo/entities/protototo-match.entity';
import { ProtototoPrediction } from './protototo/entities/protototo-prediction.entity';
import { ActivitiesModule } from './activities/activities.module';
import { Activity } from './activities/entities/activity.entity';
import { Form } from './activities/form/entities/form.entity';
import { FormQuestion } from './activities/form/entities/form-question.entity';
import { FormQuestionItem } from './activities/form/entities/form-question-item.entity';
import { FormAnswerValue } from './activities/form/entities/form-answer-value.entity';
import { FormAnswer } from './activities/form/entities/form-answer.question';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { CategorySubscriber } from './categories/subscribers/category.subscriber';
import { ConfigModule } from '@nestjs/config';
import * as process from 'process';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: ['../../.env', '../../.env.local'],
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOSTNAME,
      port: +process.env.MYSQL_PORT,
      username: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      entities: [
        ProtototoMatch,
        ProtototoSeason,
        ProtototoPrediction,
        User,
        Team,
        UserTeamSeason,
        Season,
        Committee,
        UserCommitteeSeason,
        Category,
        Document,
        Activity,
        Form,
        FormQuestion,
        FormQuestionItem,
        FormAnswerValue,
        FormAnswer,
        RefreshToken,
      ],
      subscribers: [CategorySubscriber],
      synchronize: true,
      autoLoadEntities: true,
    }),

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
