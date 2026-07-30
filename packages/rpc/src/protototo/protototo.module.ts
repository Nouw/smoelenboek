import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventStoreModule } from '../event-store/event-store.module';
import { UsersModule } from '../users/users.module';
import { SubmitProtototoEntryHandler } from './commands/protototo-entry.handler';
import {
  AddProtototoMatchHandler,
  RemoveProtototoMatchHandler,
} from './commands/protototo-match.handlers';
import {
  ArchiveProtototoRoundHandler,
  CreateProtototoRoundHandler,
  PublishProtototoRoundHandler,
  UpdateProtototoRoundHandler,
} from './commands/protototo-round.handlers';
import { SyncProtototoRoundHandler } from './commands/protototo-sync.handler';
import { ProtototoEntryEntity } from './entities/protototo-entry.entity';
import { ProtototoMatchEntity } from './entities/protototo-match.entity';
import { ProtototoPredictionEntity } from './entities/protototo-prediction.entity';
import { ProtototoRoundEntity } from './entities/protototo-round.entity';
import {
  NEVOBO_FETCH,
  NEVOBO_TIMEOUT_MS,
  NevoboClient,
} from './nevobo/nevobo.client';
import { ProtototoProjector } from './projectors/protototo.projector';
import {
  GetAdminProtototoRoundHandler,
  GetCurrentProtototoRoundHandler,
  GetMemberProtototoEntryHandler,
  GetProtototoStandingsHandler,
  ListAdminProtototoEntriesHandler,
  ListAdminProtototoRoundsHandler,
  ListMemberProtototoRoundsHandler,
  ListNevoboMatchesHandler,
  ListNevoboTeamsHandler,
  LookupAnonymousProtototoEntryHandler,
} from './queries/protototo.handlers';
import { ProtototoRepository } from './repositories/protototo.repository';
import { ProtototoResultSyncService } from './services/protototo-result-sync.service';
import { ProtototoSchedulerService } from './services/protototo-scheduler.service';

@Module({
  imports: [
    EventStoreModule,
    UsersModule,
    TypeOrmModule.forFeature([
      ProtototoRoundEntity,
      ProtototoMatchEntity,
      ProtototoEntryEntity,
      ProtototoPredictionEntity,
    ]),
  ],
  providers: [
    ProtototoRepository,
    ProtototoProjector,
    NevoboClient,
    { provide: NEVOBO_FETCH, useValue: globalThis.fetch.bind(globalThis) },
    { provide: NEVOBO_TIMEOUT_MS, useValue: 8_000 },
    ProtototoResultSyncService,
    ProtototoSchedulerService,
    CreateProtototoRoundHandler,
    UpdateProtototoRoundHandler,
    PublishProtototoRoundHandler,
    ArchiveProtototoRoundHandler,
    AddProtototoMatchHandler,
    RemoveProtototoMatchHandler,
    SubmitProtototoEntryHandler,
    SyncProtototoRoundHandler,
    GetCurrentProtototoRoundHandler,
    LookupAnonymousProtototoEntryHandler,
    GetMemberProtototoEntryHandler,
    ListMemberProtototoRoundsHandler,
    GetProtototoStandingsHandler,
    ListAdminProtototoRoundsHandler,
    GetAdminProtototoRoundHandler,
    ListAdminProtototoEntriesHandler,
    ListNevoboTeamsHandler,
    ListNevoboMatchesHandler,
  ],
})
export class ProtototoModule {}
