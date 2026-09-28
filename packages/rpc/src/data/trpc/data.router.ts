import { QueryBus } from '@nestjs/cqrs';
import { protectedProcedure, router } from '../../trpc/init';
import { z } from 'zod';
import { UsersBirthdaysQuery } from '../queries/users-birthdays.query';
import { UsersJoinedQuery } from '../queries/users-joined.query';

export type DataRouterDependencies = {
  queryBus: QueryBus
}

const userBirthdayOutputSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  birthDate: z.iso.datetime()
})

const userJoinedOutputSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  joined: z.iso.datetime(),
})

export function createDataRouter(dependencies: DataRouterDependencies) {
  return router({
     birthdays: protectedProcedure
       .meta({
        name: 'Get Birthdays',
         docs: {
          description: 'Retrieve birthdays of users',
           tags: ['Data'],
           auth: true
         }
      })
       .output(z.array(userBirthdayOutputSchema))
       .query(() => dependencies.queryBus.execute(new UsersBirthdaysQuery())),
    joined: protectedProcedure
      .meta({
        name: 'Get Joined',
        docs: {
          description: 'Sort all the members based on joined date',
          tags: ['Date'],
          auth: true
        }
      })
      .output(z.array(userJoinedOutputSchema))
      .query(() => dependencies.queryBus.execute(new UsersJoinedQuery()))
  })
}
