import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ProtototoResultSyncService } from '../services/protototo-result-sync.service';
import { SyncProtototoRoundCommand } from './protototo.commands';

@CommandHandler(SyncProtototoRoundCommand)
export class SyncProtototoRoundHandler
  implements ICommandHandler<SyncProtototoRoundCommand>
{
  constructor(private readonly resultSync: ProtototoResultSyncService) {}

  execute(command: SyncProtototoRoundCommand) {
    return this.resultSync.syncRound(command.roundId, command.actorId);
  }
}
