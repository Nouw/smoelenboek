import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { protectedProcedure, router } from '../../trpc/init';
import { GetMembershipHistoryQuery } from '../../memberships/queries/get-membership-history.query';
import { SyncUserFromAuthCommand } from '../commands/sync-user-from-auth.command';
import { GetCurrentUserQuery } from '../queries/get-current-user.query';

export type UserRouterDependencies = {
  commandBus: CommandBus;
  queryBus: QueryBus;
};

const userOutputSchema = z.object({
  id: z.uuid(),
  authUserId: z.string().nullable(),
  email: z.email().nullable(),
  emailVerified: z.boolean(),
  name: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  imageUrl: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const membershipHistoryOutputSchema = z.object({
  userId: z.uuid(),
  seasonCount: z.number().int(),
  seasons: z.array(
    z.object({
      seasonId: z.uuid(),
      teamMemberships: z.array(
        z.object({
          id: z.uuid(),
          userId: z.uuid(),
          teamId: z.uuid(),
          seasonId: z.uuid(),
          role: z.enum([
            'libero',
            'middle',
            'coach_trainer',
            'setter',
            'outside_hitter',
            'opposite_hitter',
          ]),
          createdAt: z.iso.datetime(),
          updatedAt: z.iso.datetime(),
        }),
      ),
      committeeMemberships: z.array(
        z.object({
          id: z.uuid(),
          userId: z.uuid(),
          committeeId: z.uuid(),
          seasonId: z.uuid(),
          role: z.enum([
            'commissielid',
            'commissaris_externe_zaken',
            'wedstrijdsecretaris',
            'penningmeester',
            'commissaris_zaalwacht_en_arbitrage',
            'voorzitter',
            'secretaris',
          ]),
          createdAt: z.iso.datetime(),
          updatedAt: z.iso.datetime(),
        }),
      ),
    }),
  ),
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
    syncFromAuth: protectedProcedure
      .meta({
        name: 'Sync User From Auth',
        docs: {
          description:
            'Append an auth user sync event and project the authenticated user.',
          tags: ['Users'],
          auth: true,
        },
      })
      .output(userOutputSchema)
      .mutation(({ ctx }) =>
        dependencies.commandBus.execute(
          new SyncUserFromAuthCommand(ctx.userId, ctx.claims ?? {}),
        ),
      ),
    membershipHistory: protectedProcedure
      .meta({
        name: 'Get User Membership History',
        docs: {
          description: 'Get team and committee memberships grouped by season.',
          tags: ['Users', 'Memberships'],
          auth: true,
        },
      })
      .input(z.object({ userId: z.uuid().optional() }).optional())
      .output(membershipHistoryOutputSchema)
      .query(({ ctx, input }) =>
        dependencies.queryBus.execute(
          new GetMembershipHistoryQuery(input?.userId ?? ctx.userId),
        ),
      ),
  });
}
