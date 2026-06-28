import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventStoreModule } from '../event-store/event-store.module';
import { CreateSeasonHandler } from './commands/create-season.handler';
import { GenerateSeasonsHandler } from './commands/generate-seasons.handler';
import { UpdateSeasonHandler } from './commands/update-season.handler';
import { SeasonEntity } from './entities/season.entity';
import { SeasonProjector } from './projectors/season-projector';
import { GetCurrentSeasonHandler } from './queries/get-current-season.handler';
import { GetSeasonHandler } from './queries/get-season.handler';
import { ListSeasonsHandler } from './queries/list-seasons.handler';
import { SeasonsRepository } from './repositories/seasons.repository';

@Module({
  imports: [EventStoreModule, TypeOrmModule.forFeature([SeasonEntity])],
  providers: [
    SeasonsRepository,
    SeasonProjector,
    CreateSeasonHandler,
    GenerateSeasonsHandler,
    UpdateSeasonHandler,
    GetCurrentSeasonHandler,
    GetSeasonHandler,
    ListSeasonsHandler,
  ],
  exports: [SeasonsRepository],
})
export class SeasonsModule {}

