import type { CommandBus, QueryBus } from '@nestjs/cqrs';

import { createSeasonRouter } from './seasons/trpc/season.router';
import { router } from './trpc/init';
import { createUserRouter } from './users/trpc/user.router';

export type RouterDependencies = {
  commandBus: CommandBus;
  queryBus: QueryBus;
};

export function createAppRouter(dependencies: RouterDependencies) {
  return router({
    seasons: createSeasonRouter(dependencies),
    user: createUserRouter(dependencies),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
