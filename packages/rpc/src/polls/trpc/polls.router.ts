import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  createPollInputSchema,
  pollAdminResultSchema,
  pollSchema,
  submitPollVoteInputSchema,
  updatePollInputSchema,
} from '@repo/api';
import { z } from 'zod';

import { adminProcedure, protectedProcedure, router } from '../../trpc/init';
import {
  ArchivePollCommand,
  CreatePollCommand,
  DeleteDraftPollCommand,
  PublishPollCommand,
  SubmitPollVoteCommand,
  UpdatePollCommand,
} from '../commands/poll.commands';
import { toPollOutput } from '../dto/poll-output';
import {
  GetAdminPollQuery,
  GetPollResultsQuery,
  ListAdminPollsQuery,
  ListMemberPollsQuery,
} from '../queries/poll.queries';

type Dependencies = { commandBus: CommandBus; queryBus: QueryBus };

export function createPollsRouter(dependencies: Dependencies) {
  const mutate = async (command: object) => {
    const poll = await dependencies.commandBus.execute<
      object,
      Parameters<typeof toPollOutput>[0]
    >(command);
    return toPollOutput(poll);
  };
  return router({
    list: protectedProcedure
      .meta({
        name: 'List Member Polls',
        docs: {
          description: 'List open and previously answered polls.',
          tags: ['Polls'],
          auth: true,
        },
      })
      .output(z.array(pollSchema))
      .query(({ ctx }) =>
        dependencies.queryBus.execute(new ListMemberPollsQuery(ctx.userId)),
      ),
    vote: protectedProcedure
      .meta({
        name: 'Submit Poll Vote',
        docs: {
          description: 'Create or replace the current member ballot.',
          tags: ['Polls'],
          auth: true,
        },
      })
      .input(submitPollVoteInputSchema)
      .output(pollSchema)
      .mutation(async ({ ctx, input }) => {
        const poll = await dependencies.commandBus.execute<
          SubmitPollVoteCommand,
          Parameters<typeof toPollOutput>[0]
        >(new SubmitPollVoteCommand(ctx.userId, input.pollId, input.optionIds));
        return toPollOutput(poll, input.optionIds);
      }),
    admin: router({
      list: adminProcedure
        .output(z.array(pollSchema))
        .query(() => dependencies.queryBus.execute(new ListAdminPollsQuery())),
      get: adminProcedure
        .input(z.object({ pollId: z.uuid() }))
        .output(pollSchema.nullable())
        .query(({ input }) =>
          dependencies.queryBus.execute(new GetAdminPollQuery(input.pollId)),
        ),
      results: adminProcedure
        .input(z.object({ pollId: z.uuid() }))
        .output(pollAdminResultSchema)
        .query(({ input }) =>
          dependencies.queryBus.execute(new GetPollResultsQuery(input.pollId)),
        ),
      create: adminProcedure
        .input(createPollInputSchema)
        .output(pollSchema)
        .mutation(({ ctx, input }) =>
          mutate(
            new CreatePollCommand(
              ctx.userId,
              input.question,
              input.choiceMode,
              new Date(input.opensAt),
              new Date(input.closesAt),
              input.options,
            ),
          ),
        ),
      update: adminProcedure
        .input(updatePollInputSchema)
        .output(pollSchema)
        .mutation(({ ctx, input }) =>
          mutate(
            new UpdatePollCommand(
              ctx.userId,
              input.pollId,
              input.question,
              input.choiceMode,
              new Date(input.opensAt),
              new Date(input.closesAt),
              input.options,
            ),
          ),
        ),
      publish: adminProcedure
        .input(z.object({ pollId: z.uuid() }))
        .output(pollSchema)
        .mutation(({ ctx, input }) =>
          mutate(new PublishPollCommand(ctx.userId, input.pollId)),
        ),
      archive: adminProcedure
        .input(z.object({ pollId: z.uuid() }))
        .output(pollSchema)
        .mutation(({ ctx, input }) =>
          mutate(new ArchivePollCommand(ctx.userId, input.pollId)),
        ),
      deleteDraft: adminProcedure
        .input(z.object({ pollId: z.uuid() }))
        .output(z.object({ pollId: z.uuid() }))
        .mutation(async ({ ctx, input }) => ({
          pollId: await dependencies.commandBus.execute(
            new DeleteDraftPollCommand(ctx.userId, input.pollId),
          ),
        })),
    }),
  });
}
