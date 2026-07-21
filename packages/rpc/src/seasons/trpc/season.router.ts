import type { QueryBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { protectedProcedure, router } from '../../trpc/init';
import { GetCurrentSeasonQuery } from '../queries/get-current-season.query';
import { ListSeasonsQuery } from '../queries/list-seasons.query';

export type SeasonRouterDependencies = {
  queryBus: QueryBus;
};

export const seasonOutputSchema = z.object({
  key: z.number().int().min(1900).max(3000),
  label: z.string(),
  startsOn: z.iso.date(),
  endsBefore: z.iso.date(),
});

const currentSeasonInputSchema = z
  .object({
    at: z.coerce.date().optional(),
  })
  .optional();

export function createSeasonRouter(dependencies: SeasonRouterDependencies) {
  return router({
    list: protectedProcedure
      .meta({
        name: 'List Seasons',
        docs: {
          description: 'List all association seasons.',
          tags: ['Seasons'],
          auth: true,
        },
      })
      .output(z.array(seasonOutputSchema))
      .query(() => dependencies.queryBus.execute(new ListSeasonsQuery())),
    current: protectedProcedure
      .meta({
        name: 'Get Current Season',
        docs: {
          description: 'Get the season that contains the provided date.',
          tags: ['Seasons'],
          auth: true,
        },
      })
      .input(currentSeasonInputSchema)
      .output(seasonOutputSchema)
      .query(({ input }) =>
        dependencies.queryBus.execute(
          new GetCurrentSeasonQuery(input?.at ?? new Date()),
        ),
      ),
  });
}
