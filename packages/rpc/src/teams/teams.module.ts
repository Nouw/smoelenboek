import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventStoreModule } from '../event-store/event-store.module';
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
  ListTeamMembershipsBySeasonHandler,
  ListTeamsHandler,
} from './queries/team.handlers';
import { TeamsRepository } from './repositories/teams.repository';

@Module({
  imports: [
    EventStoreModule,
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
    ListTeamsHandler,
    ListTeamMembershipsBySeasonHandler,
  ],
  exports: [TeamsRepository],
})
export class TeamsModule {}

