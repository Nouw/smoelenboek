import type { QueryBus } from '@nestjs/cqrs';

import { protectedProcedure, router } from '../../trpc/init';
import {
  GetSponsorhengelMetaQuery,
  type SponsorhengelMetaDto,
} from '../queries/get-sponsorhengel-meta.query';

type Dependencies = { queryBus: QueryBus };

export function createSponsorhengelRouter({ queryBus }: Dependencies) {
  return router({
    getMeta: protectedProcedure.query((): Promise<SponsorhengelMetaDto> =>
      queryBus.execute(new GetSponsorhengelMetaQuery()),
    ),
  });
}
