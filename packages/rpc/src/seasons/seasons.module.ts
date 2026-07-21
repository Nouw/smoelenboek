import { Module } from '@nestjs/common';

import { CommitteesModule } from '../committees/committees.module';
import { TeamsModule } from '../teams/teams.module';
import { GetCurrentSeasonHandler } from './queries/get-current-season.handler';
import { ListSeasonsHandler } from './queries/list-seasons.handler';

@Module({
  imports: [CommitteesModule, TeamsModule],
  providers: [GetCurrentSeasonHandler, ListSeasonsHandler],
})
export class SeasonsModule {}
