import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventStoreModule } from '../event-store/event-store.module';
import { SyncUserFromAuthHandler } from './commands/sync-user-from-auth.handler';
import { UpdateUserProfileHandler } from './commands/update-user-profile.handler';
import { UserEntity } from './entities/user.entity';
import { UserProjector } from './projectors/user-projector';
import { GetCurrentUserHandler } from './queries/get-current-user.handler';
import { UsersRepository } from './repositories/users.repository';

@Module({
  imports: [EventStoreModule, TypeOrmModule.forFeature([UserEntity])],
  providers: [
    UsersRepository,
    UserProjector,
    GetCurrentUserHandler,
    SyncUserFromAuthHandler,
    UpdateUserProfileHandler,
  ],
  exports: [UsersRepository],
})
export class UsersModule {}
