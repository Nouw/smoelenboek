import type { CommandBus, QueryBus } from '@nestjs/cqrs';

import { protectedProcedure, router } from '../../trpc/init';
import { SyncUserFromClerkCommand } from '../commands/sync-user-from-clerk.command';
import { GetCurrentUserQuery } from '../queries/get-current-user.query';

export type UserRouterDependencies = {
  commandBus: CommandBus;
  queryBus: QueryBus;
};

export function createUserRouter(dependencies: UserRouterDependencies) {
  return router({
    me: protectedProcedure.query(({ ctx }) =>
      dependencies.queryBus.execute(new GetCurrentUserQuery(ctx.userId)),
    ),
    syncFromClerk: protectedProcedure.mutation(({ ctx }) =>
      dependencies.commandBus.execute(
        new SyncUserFromClerkCommand(ctx.userId, ctx.claims ?? {}),
      ),
    ),
  });
}
