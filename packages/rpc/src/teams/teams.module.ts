import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventStoreModule } from '../event-store/event-store.module';
import { UsersModule } from '../users/users.module';
import {
  ArchiveTeamHandler,
  AssignTeamMemberHandler,
  CreateTeamHandler,
  RemoveTeamMemberHandler,
  UpdateTeamHandler,
} from './commands/team.handlers';
import { TeamMembershipEntity } from './entities/team-membership.entity';
import { TeamEntity } from './entities/team.entity';
import { TeamProjector } from './projectors/team-projector';
import {
  GetCurrentTeamRosterHandler,
  ListTeamMembershipsBySeasonHandler,
  ListTeamsHandler,
} from './queries/team.handlers';
import { TeamsRepository } from './repositories/teams.repository';

@Module({
  imports: [
    EventStoreModule,
    UsersModule,
    TypeOrmModule.forFeature([TeamEntity, TeamMembershipEntity]),
  ],
  providers: [
    TeamsRepository,
    TeamProjector,
    CreateTeamHandler,
    UpdateTeamHandler,
    ArchiveTeamHandler,
    AssignTeamMemberHandler,
    RemoveTeamMemberHandler,
    GetCurrentTeamRosterHandler,
    ListTeamsHandler,
    ListTeamMembershipsBySeasonHandler,
  ],
  exports: [TeamsRepository],
})
export class TeamsModule {}
