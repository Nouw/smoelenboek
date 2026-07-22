import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventStoreModule } from '../event-store/event-store.module';
import { SyncUserFromAuthHandler } from './commands/sync-user-from-auth.handler';
import { UpdateUserInformationHandler } from './commands/update-user-information.handler';
import { UpdateUserProfileHandler } from './commands/update-user-profile.handler';
import { UserEntity } from './entities/user.entity';
import { UserInformationEntity } from './entities/user-information.entity';
import { UserProjector } from './projectors/user-projector';
import { UserInformationProjector } from './projectors/user-information-projector';
import { GetUserHandler } from './queries/get-user.handler';
import { GetUserInformationHandler } from './queries/get-user-information.handler';
import { UserInformationRepository } from './repositories/user-information.repository';
import { UsersRepository } from './repositories/users.repository';

@Module({
  imports: [
    EventStoreModule,
    TypeOrmModule.forFeature([UserEntity, UserInformationEntity]),
  ],
  providers: [
    UsersRepository,
    UserInformationRepository,
    UserProjector,
    UserInformationProjector,
    GetUserHandler,
    GetUserInformationHandler,
    SyncUserFromAuthHandler,
    UpdateUserInformationHandler,
    UpdateUserProfileHandler,
  ],
  exports: [UsersRepository],
})
export class UsersModule {}
