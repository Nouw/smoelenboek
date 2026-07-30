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

function adminMeta(name: string, description: string) {
  return {
    name,
    docs: { description, tags: ['Protototo'], auth: true },
  };
}

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
          description:
            'Create or replace one complete round entry as an anonymous visitor or signed-in member.',
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
        .meta(
          adminMeta(
            'List Protototo Rounds for Administration',
            'List every Protototo round, including drafts and archived rounds. Administrator access is required.',
          ),
        )
        .output(z.array(protototoRoundSchema))
        .query(() =>
          dependencies.queryBus.execute(new ListAdminProtototoRoundsQuery()),
        ),
      getRound: adminProcedure
        .meta(
          adminMeta(
            'Get Protototo Round for Administration',
            'Get one Protototo round with removed matches and synchronization details. Administrator access is required.',
          ),
        )
        .input(z.object({ roundId: z.uuid() }))
        .output(protototoRoundSchema.nullable())
        .query(({ input }) =>
          dependencies.queryBus.execute(
            new GetAdminProtototoRoundQuery(input.roundId),
          ),
        ),
      createRound: adminProcedure
        .meta(
          adminMeta(
            'Create Protototo Round',
            'Create a draft Protototo round. Administrator access is required.',
          ),
        )
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
        .meta(
          adminMeta(
            'Update Protototo Round',
            'Update round details and deadlines, including reopening a published round. Administrator access is required.',
          ),
        )
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
        .meta(
          adminMeta(
            'Publish Protototo Round',
            'Publish or reopen a Protototo round after validating its lineup. Administrator access is required.',
          ),
        )
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
        .meta(
          adminMeta(
            'Archive Protototo Round',
            'Archive a Protototo round and remove it from participant history. Administrator access is required.',
          ),
        )
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
        .meta(
          adminMeta(
            'List Nevobo Protos Teams',
            'List configured Protos teams from Nevobo for match selection. Administrator access is required.',
          ),
        )
        .output(z.array(nevoboTeamSummarySchema))
        .query(() => dependencies.queryBus.execute(new ListNevoboTeamsQuery())),
      listNevoboMatches: adminProcedure
        .meta(
          adminMeta(
            'List Nevobo Team Matches',
            'List Nevobo matches for a selected Protos team. Administrator access is required.',
          ),
        )
        .input(z.object({ selectedTeamIri: z.string().min(1) }))
        .output(z.array(nevoboMatchSummarySchema))
        .query(({ input }) =>
          dependencies.queryBus.execute(
            new ListNevoboMatchesQuery(input.selectedTeamIri),
          ),
        ),
      addMatch: adminProcedure
        .meta(
          adminMeta(
            'Add Protototo Match',
            'Snapshot a Nevobo match and add or restore it in a round. Administrator access is required.',
          ),
        )
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
        .meta(
          adminMeta(
            'Remove Protototo Match',
            'Soft-remove a match so it no longer counts toward scoring. Administrator access is required.',
          ),
        )
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
        .meta(
          adminMeta(
            'Synchronize Protototo Results',
            'Synchronize all active round matches with Nevobo and return a status summary. Administrator access is required.',
          ),
        )
        .input(z.object({ roundId: z.uuid() }))
        .output(protototoSyncResultSchema)
        .mutation(({ ctx, input }) =>
          dependencies.commandBus.execute(
            new SyncProtototoRoundCommand(input.roundId, ctx.userId),
          ),
        ),
      listEntries: adminProcedure
        .meta(
          adminMeta(
            'List Protototo Entries for Administration',
            'List detailed round entries, payment claims, completeness, and scoring. Administrator access is required.',
          ),
        )
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
