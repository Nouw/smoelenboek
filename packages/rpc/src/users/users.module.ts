import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventStoreModule } from '../event-store/event-store.module';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';
import { CreateManagedUserHandler, ResendUserInvitationHandler } from './commands/admin-user.handlers';
import { ListManagedUsersHandler } from './queries/admin-user.handlers';
import { UserProvisioningService } from './services/user-provisioning.service';
import { BetterAuthUserAccountAdmin, USER_ACCOUNT_ADMIN } from './user-account-admin';
import { UserImportController } from './import/user-import.controller';
import { UserImportService } from './import/user-import.service';
import { SyncUserFromAuthHandler } from './commands/sync-user-from-auth.handler';
import { UpdateUserInformationHandler } from './commands/update-user-information.handler';
import { UpdateUserProfileHandler } from './commands/update-user-profile.handler';
import { UserEntity } from './entities/user.entity';
import { UserInformationEntity } from './entities/user-information.entity';
import { UserProjector } from './projectors/user-projector';
import { UserInformationProjector } from './projectors/user-information-projector';
import { GetUserHandler } from './queries/get-user.handler';
import { GetUserInformationHandler } from './queries/get-user-information.handler';
import { SearchUsersHandler } from './queries/search-users.handler';
import { UserInformationRepository } from './repositories/user-information.repository';
import { UsersRepository } from './repositories/users.repository';
import {
  UserInformationUpdatedHandler
} from './listeners/user-information-updated.handler';

@Module({
  controllers: [UserImportController],
  imports: [
    EventStoreModule,
    EmailModule,
    AuthModule,
    TypeOrmModule.forFeature([UserEntity, UserInformationEntity]),
  ],
  providers: [
    UsersRepository,
    UserInformationRepository,
    UserProjector,
    UserInformationProjector,
    GetUserHandler,
    GetUserInformationHandler,
    SearchUsersHandler,
    SyncUserFromAuthHandler,
    UpdateUserInformationHandler,
    UpdateUserProfileHandler,
    CreateManagedUserHandler,
    ResendUserInvitationHandler,
    ListManagedUsersHandler,
    UserProvisioningService,
    UserImportService,
    UserInformationUpdatedHandler,
    { provide: USER_ACCOUNT_ADMIN, useClass: BetterAuthUserAccountAdmin },
  ],
  exports: [UsersRepository],
})
export class UsersModule {}
