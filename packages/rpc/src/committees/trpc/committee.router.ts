import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { protectedProcedure, router } from '../../trpc/init';
import {
  ArchiveCommitteeCommand,
  AssignCommitteeMemberCommand,
  CreateCommitteeCommand,
  RemoveCommitteeMemberCommand,
  UpdateCommitteeCommand,
} from '../commands/committee.commands';
import { COMMITTEE_ROLES } from '../committee-catalog';
import {
  ListCommitteeMembershipsBySeasonQuery,
  ListCommitteesQuery,
} from '../queries/committee.queries';

export type CommitteeRouterDependencies = {
  commandBus: CommandBus;
  queryBus: QueryBus;
};

const committeeRoleSchema = z.enum(COMMITTEE_ROLES);

const committeeOutputSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  archivedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const committeeMembershipOutputSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  committeeId: z.uuid(),
  seasonId: z.uuid(),
  role: committeeRoleSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export function createCommitteeRouter(
  dependencies: CommitteeRouterDependencies,
) {
  return router({
    list: protectedProcedure
      .meta({
        name: 'List Committees',
        docs: {
          description: 'List all committees.',
          tags: ['Committees'],
          auth: true,
        },
      })
      .output(z.array(committeeOutputSchema))
      .query(() => dependencies.queryBus.execute(new ListCommitteesQuery())),
    membershipsBySeason: protectedProcedure
      .meta({
        name: 'List Committee Memberships By Season',
        docs: {
          description: 'List committee memberships for one season.',
          tags: ['Committees'],
          auth: true,
        },
      })
      .input(z.object({ seasonId: z.uuid() }))
      .output(z.array(committeeMembershipOutputSchema))
      .query(({ input }) =>
        dependencies.queryBus.execute(
          new ListCommitteeMembershipsBySeasonQuery(input.seasonId),
        ),
      ),
    create: protectedProcedure
      .meta({
        name: 'Create Committee',
        docs: {
          description: 'Create a committee catalog record.',
          tags: ['Committees'],
          auth: true,
        },
      })
      .input(z.object({ name: z.string().min(1) }))
      .output(committeeOutputSchema)
      .mutation(({ input }) =>
        dependencies.commandBus.execute(
          new CreateCommitteeCommand(input.name),
        ),
      ),
    update: protectedProcedure
      .meta({
        name: 'Update Committee',
        docs: {
          description: 'Rename a committee catalog record.',
          tags: ['Committees'],
          auth: true,
        },
      })
      .input(z.object({ id: z.uuid(), name: z.string().min(1) }))
      .output(committeeOutputSchema)
      .mutation(({ input }) =>
        dependencies.commandBus.execute(
          new UpdateCommitteeCommand(input.id, input.name),
        ),
      ),
    archive: protectedProcedure
      .meta({
        name: 'Archive Committee',
        docs: {
          description: 'Archive a committee catalog record.',
          tags: ['Committees'],
          auth: true,
        },
      })
      .input(z.object({ id: z.uuid() }))
      .output(committeeOutputSchema)
      .mutation(({ input }) =>
        dependencies.commandBus.execute(
          new ArchiveCommitteeCommand(input.id),
        ),
      ),
    assignMember: protectedProcedure
      .meta({
        name: 'Assign Committee Member',
        docs: {
          description: 'Assign a user to a committee for a season.',
          tags: ['Committees'],
          auth: true,
        },
      })
      .input(
        z.object({
          userId: z.uuid(),
          committeeId: z.uuid(),
          seasonId: z.uuid(),
          role: committeeRoleSchema,
        }),
      )
      .output(committeeMembershipOutputSchema)
      .mutation(({ input }) =>
        dependencies.commandBus.execute(
          new AssignCommitteeMemberCommand(
            input.userId,
            input.committeeId,
            input.seasonId,
            input.role,
          ),
        ),
      ),
    removeMember: protectedProcedure
      .meta({
        name: 'Remove Committee Member',
        docs: {
          description: 'Remove a committee membership assignment.',
          tags: ['Committees'],
          auth: true,
        },
      })
      .input(z.object({ membershipId: z.uuid() }))
      .output(committeeMembershipOutputSchema.nullable())
      .mutation(({ input }) =>
        dependencies.commandBus.execute(
          new RemoveCommitteeMemberCommand(input.membershipId),
        ),
      ),
  });
}

