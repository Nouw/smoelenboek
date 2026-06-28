import type { CommandBus, QueryBus } from '@nestjs/cqrs';

import { createCommitteeRouter } from './committees/trpc/committee.router';
import { createSeasonRouter } from './seasons/trpc/season.router';
import { createTeamRouter } from './teams/trpc/team.router';
import { router } from './trpc/init';
import { createUserRouter } from './users/trpc/user.router';

export type RouterDependencies = {
  commandBus: CommandBus;
  queryBus: QueryBus;
};

export function createAppRouter(dependencies: RouterDependencies) {
  return router({
    committees: createCommitteeRouter(dependencies),
    seasons: createSeasonRouter(dependencies),
    teams: createTeamRouter(dependencies),
    user: createUserRouter(dependencies),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
