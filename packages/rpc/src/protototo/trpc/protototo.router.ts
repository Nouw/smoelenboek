import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  createProtototoRoundInputSchema,
  nevoboMatchSummarySchema,
  nevoboTeamSummarySchema,
  protototoAdminEntrySchema,
  protototoEmailInputSchema,
  protototoEntrySchema,
  protototoMatchSchema,
  protototoRoundSchema,
  protototoStandingSchema,
  protototoSyncResultSchema,
  submitProtototoEntryInputSchema,
  updateProtototoRoundInputSchema,
} from '@repo/api';
import { z } from 'zod';

import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from '../../trpc/init';
import {
  AddProtototoMatchCommand,
  ArchiveProtototoRoundCommand,
  CreateProtototoRoundCommand,
  PublishProtototoRoundCommand,
  RemoveProtototoMatchCommand,
  SubmitProtototoEntryCommand,
  SyncProtototoRoundCommand,
  UpdateProtototoRoundCommand,
} from '../commands/protototo.commands';
import {
  toEntryOutput,
  toMatchOutput,
  toRoundOutput,
} from '../dto/protototo-output';
import {
  GetAdminProtototoRoundQuery,
  GetCurrentProtototoRoundQuery,
  GetMemberProtototoEntryQuery,
  GetProtototoStandingsQuery,
  ListAdminProtototoEntriesQuery,
  ListAdminProtototoRoundsQuery,
  ListMemberProtototoRoundsQuery,
  ListNevoboMatchesQuery,
  ListNevoboTeamsQuery,
  LookupAnonymousProtototoEntryQuery,
} from '../queries/protototo.queries';

type Dependencies = { commandBus: CommandBus; queryBus: QueryBus };

export function createProtototoRouter(dependencies: Dependencies) {
  return router({
    current: publicProcedure
      .meta({
        name: 'Get Current Protototo Round',
        docs: {
          description: 'Get the currently open public round.',
          tags: ['Protototo'],
          auth: false,
        },
      })
      .output(
        z
          .object({
            round: protototoRoundSchema,
            entry: protototoEntrySchema.nullable(),
          })
          .nullable(),
      )
      .query(({ ctx }) =>
        dependencies.queryBus.execute(
          new GetCurrentProtototoRoundQuery(ctx.userId, new Date()),
        ),
      ),
    lookupAnonymousEntry: publicProcedure
      .meta({
        name: 'Lookup Anonymous Protototo Entry',
        docs: {
          description: 'Load an anonymous entry while betting is open.',
          tags: ['Protototo'],
          auth: false,
        },
      })
      .input(
        z.object({
          roundId: z.uuid(),
          email: protototoEmailInputSchema,
          firstName: z.string().trim().min(1).max(100),
        }),
      )
      .output(protototoEntrySchema.nullable())
      .mutation(({ input }) =>
        dependencies.queryBus.execute(
          new LookupAnonymousProtototoEntryQuery(
            input.roundId,
            input.email,
            input.firstName,
            new Date(),
          ),
        ),
      ),
    submitEntry: publicProcedure
      .meta({
        name: 'Submit Protototo Entry',
        docs: {
          description: 'Create or replace one complete round entry.',
          tags: ['Protototo'],
          auth: false,
        },
      })
      .input(submitProtototoEntryInputSchema)
      .output(protototoEntrySchema)
      .mutation(async ({ ctx, input }) => {
        const entry = await dependencies.commandBus.execute<
          SubmitProtototoEntryCommand,
          Parameters<typeof toEntryOutput>[0]
        >(
          new SubmitProtototoEntryCommand(
            ctx.userId,
            input.roundId,
            input.predictions,
            input.firstName,
            input.email,
            input.paymentClaimed,
          ),
        );
        return toEntryOutput(entry);
      }),
    memberRounds: protectedProcedure
      .meta({
        name: 'List Member Protototo Rounds',
        docs: {
          description: 'List published rounds for signed-in members.',
          tags: ['Protototo'],
          auth: true,
        },
      })
      .output(z.array(protototoRoundSchema))
      .query(() =>
        dependencies.queryBus.execute(new ListMemberProtototoRoundsQuery()),
      ),
    myEntry: protectedProcedure
      .meta({
        name: 'Get Member Protototo Entry',
        docs: {
          description: 'Get the signed-in member entry for a round.',
          tags: ['Protototo'],
          auth: true,
        },
      })
      .input(z.object({ roundId: z.uuid() }))
      .output(protototoEntrySchema.nullable())
      .query(({ ctx, input }) =>
        dependencies.queryBus.execute(
          new GetMemberProtototoEntryQuery(input.roundId, ctx.userId),
        ),
      ),
    standings: protectedProcedure
      .meta({
        name: 'Get Protototo Standings',
        docs: {
          description: 'Get member-only standings after betting closes.',
          tags: ['Protototo'],
          auth: true,
        },
      })
      .input(z.object({ roundId: z.uuid() }))
      .output(z.array(protototoStandingSchema))
      .query(({ input }) =>
        dependencies.queryBus.execute(
          new GetProtototoStandingsQuery(input.roundId, new Date()),
        ),
      ),
    admin: router({
      listRounds: adminProcedure
        .output(z.array(protototoRoundSchema))
        .query(() =>
          dependencies.queryBus.execute(new ListAdminProtototoRoundsQuery()),
        ),
      getRound: adminProcedure
        .input(z.object({ roundId: z.uuid() }))
        .output(protototoRoundSchema.nullable())
        .query(({ input }) =>
          dependencies.queryBus.execute(
            new GetAdminProtototoRoundQuery(input.roundId),
          ),
        ),
      createRound: adminProcedure
        .input(createProtototoRoundInputSchema)
        .output(protototoRoundSchema)
        .mutation(async ({ ctx, input }) => {
          const round = await dependencies.commandBus.execute<
            CreateProtototoRoundCommand,
            Parameters<typeof toRoundOutput>[0]
          >(
            new CreateProtototoRoundCommand(
              ctx.userId,
              input.title,
              new Date(input.opensAt),
              new Date(input.closesAt),
              input.tikkieUrl ?? null,
            ),
          );
          return toRoundOutput(round, new Date(), true, true, true);
        }),
      updateRound: adminProcedure
        .input(updateProtototoRoundInputSchema)
        .output(protototoRoundSchema)
        .mutation(async ({ ctx, input }) => {
          const round = await dependencies.commandBus.execute<
            UpdateProtototoRoundCommand,
            Parameters<typeof toRoundOutput>[0]
          >(
            new UpdateProtototoRoundCommand(
              ctx.userId,
              input.roundId,
              input.title,
              new Date(input.opensAt),
              new Date(input.closesAt),
              input.tikkieUrl ?? null,
            ),
          );
          return toRoundOutput(round, new Date(), true, true, true);
        }),
      publishRound: adminProcedure
        .input(z.object({ roundId: z.uuid() }))
        .output(protototoRoundSchema)
        .mutation(async ({ ctx, input }) => {
          const round = await dependencies.commandBus.execute<
            PublishProtototoRoundCommand,
            Parameters<typeof toRoundOutput>[0]
          >(new PublishProtototoRoundCommand(ctx.userId, input.roundId));
          return toRoundOutput(round, new Date(), true, true, true);
        }),
      archiveRound: adminProcedure
        .input(z.object({ roundId: z.uuid() }))
        .output(protototoRoundSchema)
        .mutation(async ({ ctx, input }) => {
          const round = await dependencies.commandBus.execute<
            ArchiveProtototoRoundCommand,
            Parameters<typeof toRoundOutput>[0]
          >(new ArchiveProtototoRoundCommand(ctx.userId, input.roundId));
          return toRoundOutput(round, new Date(), true, true, true);
        }),
      listNevoboTeams: adminProcedure
        .output(z.array(nevoboTeamSummarySchema))
        .query(() => dependencies.queryBus.execute(new ListNevoboTeamsQuery())),
      listNevoboMatches: adminProcedure
        .input(z.object({ selectedTeamIri: z.string().min(1) }))
        .output(z.array(nevoboMatchSummarySchema))
        .query(({ input }) =>
          dependencies.queryBus.execute(
            new ListNevoboMatchesQuery(input.selectedTeamIri),
          ),
        ),
      addMatch: adminProcedure
        .input(
          z.object({
            roundId: z.uuid(),
            selectedTeamIri: z.string().min(1),
            nevoboMatchId: z.uuid(),
          }),
        )
        .output(protototoMatchSchema)
        .mutation(async ({ ctx, input }) => {
          const match = await dependencies.commandBus.execute<
            AddProtototoMatchCommand,
            Parameters<typeof toMatchOutput>[0]
          >(
            new AddProtototoMatchCommand(
              ctx.userId,
              input.roundId,
              input.selectedTeamIri,
              input.nevoboMatchId,
            ),
          );
          return toMatchOutput(match);
        }),
      removeMatch: adminProcedure
        .input(z.object({ matchId: z.uuid() }))
        .output(protototoMatchSchema)
        .mutation(async ({ ctx, input }) => {
          const match = await dependencies.commandBus.execute<
            RemoveProtototoMatchCommand,
            Parameters<typeof toMatchOutput>[0]
          >(new RemoveProtototoMatchCommand(ctx.userId, input.matchId));
          return toMatchOutput(match);
        }),
      syncResults: adminProcedure
        .input(z.object({ roundId: z.uuid() }))
        .output(protototoSyncResultSchema)
        .mutation(({ ctx, input }) =>
          dependencies.commandBus.execute(
            new SyncProtototoRoundCommand(input.roundId, ctx.userId),
          ),
        ),
      listEntries: adminProcedure
        .input(z.object({ roundId: z.uuid() }))
        .output(z.array(protototoAdminEntrySchema))
        .query(({ input }) =>
          dependencies.queryBus.execute(
            new ListAdminProtototoEntriesQuery(input.roundId),
          ),
        ),
    }),
  });
}
