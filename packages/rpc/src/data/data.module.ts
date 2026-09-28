import { Module } from '@nestjs/common';
import { UserInformationEntity } from '../users/entities/user-information.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersBirthdaysHandler } from './queries/users-birthdays.handler';
import { UsersJoinedHandler } from './queries/users-joined.handler';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([UserInformationEntity])],
  providers: [UsersBirthdaysHandler, UsersJoinedHandler]
})
export class DataModule {}
