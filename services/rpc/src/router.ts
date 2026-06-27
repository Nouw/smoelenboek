import type { CommandBus, QueryBus } from '@nestjs/cqrs';

import { router } from './trpc/init';
import { createUserRouter } from './users/trpc/user.router';

export type RouterDependencies = {
  commandBus: CommandBus;
  queryBus: QueryBus;
};

export function createAppRouter(dependencies: RouterDependencies) {
  return router({
    user: createUserRouter(dependencies),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
