import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventStoreModule } from '../event-store/event-store.module';
import { UsersModule } from '../users/users.module';
import {
  ArchiveCommitteeHandler,
  AssignCommitteeMemberHandler,
  CreateCommitteeHandler,
  RemoveCommitteeMemberHandler,
  UpdateCommitteeHandler,
} from './commands/committee.handlers';
import { CommitteeMembershipEntity } from './entities/committee-membership.entity';
import { CommitteeEntity } from './entities/committee.entity';
import { CommitteeProjector } from './projectors/committee-projector';
import {
  GetCurrentCommitteeRosterHandler,
  ListCommitteeMembershipsBySeasonHandler,
  ListCommitteesHandler,
} from './queries/committee.handlers';
import { CommitteesRepository } from './repositories/committees.repository';

@Module({
  imports: [
    EventStoreModule,
    UsersModule,
    TypeOrmModule.forFeature([CommitteeEntity, CommitteeMembershipEntity]),
  ],
  providers: [
    CommitteesRepository,
    CommitteeProjector,
    CreateCommitteeHandler,
    UpdateCommitteeHandler,
    ArchiveCommitteeHandler,
    AssignCommitteeMemberHandler,
    RemoveCommitteeMemberHandler,
    GetCurrentCommitteeRosterHandler,
    ListCommitteesHandler,
    ListCommitteeMembershipsBySeasonHandler,
  ],
  exports: [CommitteesRepository],
})
export class CommitteesModule {}
