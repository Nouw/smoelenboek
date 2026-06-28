import { Module } from '@nestjs/common';

import { CommitteesModule } from '../committees/committees.module';
import { TeamsModule } from '../teams/teams.module';
import { GetMembershipHistoryHandler } from './queries/get-membership-history.handler';

@Module({
  imports: [CommitteesModule, TeamsModule],
  providers: [GetMembershipHistoryHandler],
})
export class MembershipsModule {}

