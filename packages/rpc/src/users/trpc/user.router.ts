import {
  updateUserInformationSchema,
  updateUserProfileSchema,
} from '@repo/api';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { protectedProcedure, router } from '../../trpc/init';
import { GetMembershipHistoryQuery } from '../../memberships/queries/get-membership-history.query';
import { SyncUserFromAuthCommand } from '../commands/sync-user-from-auth.command';
import { UpdateUserInformationCommand } from '../commands/update-user-information.command';
import { UpdateUserProfileCommand } from '../commands/update-user-profile.command';
import { GetCurrentUserQuery } from '../queries/get-current-user.query';
import { GetUserInformationQuery } from '../queries/get-user-information.query';

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
  role: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const userInformationOutputSchema = z.object({
  userId: z.uuid(),
  streetName: z.string().nullable(),
  houseNumber: z.string().nullable(),
  postcode: z.string().nullable(),
  city: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  bankAccountNumber: z.string().nullable().optional(),
  birthDate: z.iso.date().nullable(),
  bondNumber: z.string().nullable(),
  joinDate: z.iso.date().nullable(),
  leaveDate: z.iso.date().nullable(),
  backNumber: z.number().int().min(0).max(32767).nullable(),
  refereeLicense: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const membershipHistoryOutputSchema = z.object({
  userId: z.uuid(),
  seasonCount: z.number().int(),
  seasons: z.array(
    z.object({
      seasonKey: z.number().int().min(1900).max(3000),
      label: z.string(),
      startsOn: z.iso.date(),
      endsBefore: z.iso.date(),
      teamMemberships: z.array(
        z.object({
          id: z.uuid(),
          userId: z.uuid(),
          teamId: z.uuid(),
          seasonKey: z.number().int().min(1900).max(3000),
          role: z.enum([
            'libero',
            'middle',
            'coach_trainer',
            'setter',
            'outside_hitter',
            'opposite_hitter',
          ]),
          startedOn: z.iso.date(),
          endedOn: z.iso.date().nullable(),
          createdAt: z.iso.datetime(),
          updatedAt: z.iso.datetime(),
        }),
      ),
      committeeMemberships: z.array(
        z.object({
          id: z.uuid(),
          userId: z.uuid(),
          committeeId: z.uuid(),
          seasonKey: z.number().int().min(1900).max(3000),
          role: z.enum([
            'commissielid',
            'commissaris_externe_zaken',
            'wedstrijdsecretaris',
            'penningmeester',
            'commissaris_zaalwacht_en_arbitrage',
            'voorzitter',
            'secretaris',
          ]),
          startedOn: z.iso.date(),
          endedOn: z.iso.date().nullable(),
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
    updateProfile: protectedProcedure
      .meta({
        name: 'Update User Profile',
        docs: {
          description:
            'Update the authenticated user profile image URL via an event-sourced command.',
          tags: ['Users'],
          auth: true,
        },
      })
      .input(updateUserProfileSchema)
      .output(userOutputSchema)
      .mutation(({ ctx, input }) =>
        dependencies.commandBus.execute(
          new UpdateUserProfileCommand(ctx.userId, input),
        ),
      ),
    information: protectedProcedure
      .meta({
        name: 'Get User Information',
        docs: {
          description:
            'Get association information. Bank details are visible only to the owner or an admin.',
          tags: ['Users'],
          auth: true,
        },
      })
      .input(z.object({ userId: z.uuid().optional() }).optional())
      .output(userInformationOutputSchema.nullable())
      .query(({ ctx, input }) =>
        dependencies.queryBus.execute(
          new GetUserInformationQuery(
            ctx.userId,
            ctx.role,
            input?.userId ?? ctx.userId,
          ),
        ),
      ),
    updateInformation: protectedProcedure
      .meta({
        name: 'Update User Information',
        docs: {
          description:
            'Update association information for the authenticated user or, as an admin, another user.',
          tags: ['Users'],
          auth: true,
        },
      })
      .input(
        z.object({
          userId: z.uuid().optional(),
          changes: updateUserInformationSchema,
        }),
      )
      .output(userInformationOutputSchema)
      .mutation(({ ctx, input }) =>
        dependencies.commandBus.execute(
          new UpdateUserInformationCommand(
            ctx.userId,
            ctx.role,
            input.userId ?? ctx.userId,
            input.changes,
          ),
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
