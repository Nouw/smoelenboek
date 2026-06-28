import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { protectedProcedure, router } from '../../trpc/init';
import { CreateSeasonCommand } from '../commands/create-season.command';
import { GenerateSeasonsCommand } from '../commands/generate-seasons.command';
import { UpdateSeasonCommand } from '../commands/update-season.command';
import { GetCurrentSeasonQuery } from '../queries/get-current-season.query';
import { GetSeasonQuery } from '../queries/get-season.query';
import { ListSeasonsQuery } from '../queries/list-seasons.query';

export type SeasonRouterDependencies = {
  commandBus: CommandBus;
  queryBus: QueryBus;
};

export const seasonOutputSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const generateSeasonsInputSchema = z
  .object({
    startYear: z.number().int().min(1900).max(3000),
    endYear: z.number().int().min(1900).max(3000),
  })
  .refine((input) => input.startYear <= input.endYear, {
    message: 'startYear must be before or equal to endYear.',
    path: ['endYear'],
  });

const seasonWriteInputSchema = z.object({
  name: z.string().min(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

const updateSeasonInputSchema = seasonWriteInputSchema.extend({
  id: z.uuid(),
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
      .output(seasonOutputSchema.nullable())
      .query(({ input }) =>
        dependencies.queryBus.execute(
          new GetCurrentSeasonQuery(input?.at ?? new Date()),
        ),
      ),
    byId: protectedProcedure
      .meta({
        name: 'Get Season',
        docs: {
          description: 'Get one season by id.',
          tags: ['Seasons'],
          auth: true,
        },
      })
      .input(z.object({ id: z.uuid() }))
      .output(seasonOutputSchema.nullable())
      .query(({ input }) =>
        dependencies.queryBus.execute(new GetSeasonQuery(input.id)),
      ),
    generate: protectedProcedure
      .meta({
        name: 'Generate Seasons',
        docs: {
          description:
            'Generate stored seasons from the default August 1 to July 31 rule.',
          tags: ['Seasons'],
          auth: true,
        },
      })
      .input(generateSeasonsInputSchema)
      .output(z.array(seasonOutputSchema))
      .mutation(({ input }) =>
        dependencies.commandBus.execute(
          new GenerateSeasonsCommand(input.startYear, input.endYear),
        ),
      ),
    create: protectedProcedure
      .meta({
        name: 'Create Season',
        docs: {
          description: 'Create one season manually for an exception.',
          tags: ['Seasons'],
          auth: true,
        },
      })
      .input(seasonWriteInputSchema)
      .output(seasonOutputSchema)
      .mutation(({ input }) =>
        dependencies.commandBus.execute(
          new CreateSeasonCommand(input.name, input.startsAt, input.endsAt),
        ),
      ),
    update: protectedProcedure
      .meta({
        name: 'Update Season',
        docs: {
          description: 'Update one existing season.',
          tags: ['Seasons'],
          auth: true,
        },
      })
      .input(updateSeasonInputSchema)
      .output(seasonOutputSchema)
      .mutation(({ input }) =>
        dependencies.commandBus.execute(
          new UpdateSeasonCommand(
            input.id,
            input.name,
            input.startsAt,
            input.endsAt,
          ),
        ),
      ),
  });
}

