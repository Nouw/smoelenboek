import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventStoreModule } from '../event-store/event-store.module';
import { UsersModule } from '../users/users.module';
import {
  ArchivePollHandler,
  CreatePollHandler,
  DeleteDraftPollHandler,
  PublishPollHandler,
  SubmitPollVoteHandler,
  UpdatePollHandler,
} from './commands/poll.handlers';
import { PollEntity } from './entities/poll.entity';
import { PollOptionEntity } from './entities/poll-option.entity';
import { PollResponseEntity } from './entities/poll-response.entity';
import { PollSelectionEntity } from './entities/poll-selection.entity';
import { PollsProjector } from './projectors/polls.projector';
import {
  GetAdminPollHandler,
  GetPollResultsHandler,
  ListAdminPollsHandler,
  ListMemberPollsHandler,
} from './queries/poll.handlers';
import { PollsRepository } from './repositories/polls.repository';

@Module({
  imports: [
    EventStoreModule,
    UsersModule,
    TypeOrmModule.forFeature([
      PollEntity,
      PollOptionEntity,
      PollResponseEntity,
      PollSelectionEntity,
    ]),
  ],
  providers: [
    PollsRepository,
    PollsProjector,
    CreatePollHandler,
    UpdatePollHandler,
    PublishPollHandler,
    ArchivePollHandler,
    DeleteDraftPollHandler,
    SubmitPollVoteHandler,
    ListMemberPollsHandler,
    ListAdminPollsHandler,
    GetAdminPollHandler,
    GetPollResultsHandler,
  ],
})
export class PollsModule {}
