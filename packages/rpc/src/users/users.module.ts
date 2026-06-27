import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SyncUserFromClerkHandler } from './commands/sync-user-from-clerk.handler';
import { UserEntity } from './entities/user.entity';
import { GetCurrentUserHandler } from './queries/get-current-user.handler';
import { UsersRepository } from './repositories/users.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UsersRepository, GetCurrentUserHandler, SyncUserFromClerkHandler],
  exports: [UsersRepository],
})
export class UsersModule {}
