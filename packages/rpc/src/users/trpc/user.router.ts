import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { protectedProcedure, router } from '../../trpc/init';
import { SyncUserFromClerkCommand } from '../commands/sync-user-from-clerk.command';
import { GetCurrentUserQuery } from '../queries/get-current-user.query';

export type UserRouterDependencies = {
  commandBus: CommandBus;
  queryBus: QueryBus;
};

const userOutputSchema = z.object({
  id: z.uuid(),
  clerkUserId: z.string(),
  email: z.email().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  imageUrl: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export function createUserRouter(dependencies: UserRouterDependencies) {
  return router({
    me: protectedProcedure
      .meta({
        name: 'Get Current User',
        docs: {
          description: 'Get the authenticated user projection.',
          tags: ['Users'],
          auth: true,
        },
      })
      .output(userOutputSchema.nullable())
      .query(({ ctx }) =>
        dependencies.queryBus.execute(new GetCurrentUserQuery(ctx.userId)),
      ),
    syncFromClerk: protectedProcedure
      .meta({
        name: 'Sync User From Clerk',
        docs: {
          description:
            'Append a Clerk user sync event and project the authenticated user.',
          tags: ['Users'],
          auth: true,
        },
      })
      .output(userOutputSchema)
      .mutation(({ ctx }) =>
        dependencies.commandBus.execute(
          new SyncUserFromClerkCommand(ctx.userId, ctx.claims ?? {}),
        ),
      ),
  });
}
