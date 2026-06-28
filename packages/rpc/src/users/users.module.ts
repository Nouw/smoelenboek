import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventStoreModule } from '../event-store/event-store.module';
import { SyncUserFromClerkHandler } from './commands/sync-user-from-clerk.handler';
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
    SyncUserFromClerkHandler,
  ],
  exports: [UsersRepository],
})
export class UsersModule {}
