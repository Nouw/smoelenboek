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
  GetCurrentCommitteeRosterQuery,
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
  seasonKey: z.number().int().min(1900).max(3000),
  role: committeeRoleSchema,
  startedOn: z.iso.date(),
  endedOn: z.iso.date().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const committeeRosterMemberOutputSchema = z.object({
  userId: z.uuid(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  role: committeeRoleSchema,
});

const currentCommitteeRosterOutputSchema = z.object({
  committee: committeeOutputSchema,
  season: z.object({
    key: z.number().int().min(1900).max(3000),
    label: z.string(),
    startsOn: z.iso.date(),
    endsBefore: z.iso.date(),
  }),
  members: z.array(committeeRosterMemberOutputSchema),
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
    currentRoster: protectedProcedure
      .meta({
        name: 'Get Current Committee Roster',
        docs: {
          description:
            'Get one committee and its active current-season members.',
          tags: ['Committees'],
          auth: true,
        },
      })
      .input(z.object({ committeeId: z.uuid() }))
      .output(currentCommitteeRosterOutputSchema.nullable())
      .query(({ input }) =>
        dependencies.queryBus.execute(
          new GetCurrentCommitteeRosterQuery(input.committeeId, new Date()),
        ),
      ),
    membershipsBySeason: protectedProcedure
      .meta({
        name: 'List Committee Memberships By Season',
        docs: {
          description: 'List committee memberships for one season.',
          tags: ['Committees'],
          auth: true,
        },
      })
      .input(z.object({ seasonKey: z.number().int().min(1900).max(3000) }))
      .output(z.array(committeeMembershipOutputSchema))
      .query(({ input }) =>
        dependencies.queryBus.execute(
          new ListCommitteeMembershipsBySeasonQuery(input.seasonKey),
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
        dependencies.commandBus.execute(new CreateCommitteeCommand(input.name)),
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
        dependencies.commandBus.execute(new ArchiveCommitteeCommand(input.id)),
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
          seasonKey: z.number().int().min(1900).max(3000).optional(),
          role: committeeRoleSchema,
          startedOn: z.iso.date().optional(),
        }),
      )
      .output(committeeMembershipOutputSchema)
      .mutation(({ input }) =>
        dependencies.commandBus.execute(
          new AssignCommitteeMemberCommand(
            input.userId,
            input.committeeId,
            input.role,
            input.seasonKey,
            input.startedOn,
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
