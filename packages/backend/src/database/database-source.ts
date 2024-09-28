import * as process from 'process';
import { ProtototoMatch } from '../protototo/entities/protototo-match.entity';
import { ProtototoSeason } from '../protototo/entities/protototo-season.entity';
import { ProtototoPrediction } from '../protototo/entities/protototo-prediction.entity';
import { User } from '../users/entities/user.entity';
import { Team } from '../teams/entities/team.entity';
import { UserTeamSeason } from '../teams/entities/user-team-season.entity';
import { Season } from '../season/entities/season.entity';
import { Committee } from '../committees/entities/committee.entity';
import { UserCommitteeSeason } from '../committees/entities/user-committee-season.entity';
import { Category } from '../categories/entities/category.entity';
import { Document } from '../documents/entities/document.entity';
import { Activity } from '../activities/entities/activity.entity';
import { Form } from '../activities/form/entities/form.entity';
import { FormQuestion } from '../activities/form/entities/form-question.entity';
import { FormQuestionItem } from '../activities/form/entities/form-question-item.entity';
import { FormAnswerValue } from '../activities/form/entities/form-answer-value.entity';
import { FormAnswer } from '../activities/form/entities/form-answer.question';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { ResetToken } from '../auth/entities/reset-token.entity';
import { CategorySubscriber } from '../categories/subscribers/category.subscriber';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ProtototoMatchResult } from '../protototo/entities/protototo-result.entity';
import { ProtototoPredictionExternal } from '../protototo/entities/protototo-prediction-external.entity';

dotenv.config({ path: '../../.env' });
console.log(path.join(__dirname, '../migrations/**/*.ts'));
export const databaseSource: TypeOrmModuleOptions = {
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
    ProtototoPredictionExternal,
    ProtototoMatchResult,
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
    ResetToken,
  ],
  subscribers: [CategorySubscriber],
  migrations: [path.join(__dirname, '../migrations/**/*.ts')],
  synchronize: false,
  autoLoadEntities: true,
};
