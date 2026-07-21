import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { protectedProcedure, router } from '../../trpc/init';
import {
  ArchiveTeamCommand,
  AssignTeamMemberCommand,
  CreateTeamCommand,
  RemoveTeamMemberCommand,
  UpdateTeamCommand,
} from '../commands/team.commands';
import { TEAM_ROLES } from '../team-catalog';
import {
  ListTeamMembershipsBySeasonQuery,
  ListTeamsQuery,
} from '../queries/team.queries';

export type TeamRouterDependencies = {
  commandBus: CommandBus;
  queryBus: QueryBus;
};

const teamRoleSchema = z.enum(TEAM_ROLES);

const teamOutputSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  archivedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const teamMembershipOutputSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  teamId: z.uuid(),
  seasonKey: z.number().int().min(1900).max(3000),
  role: teamRoleSchema,
  startedOn: z.iso.date(),
  endedOn: z.iso.date().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export function createTeamRouter(dependencies: TeamRouterDependencies) {
  return router({
    list: protectedProcedure
      .meta({
        name: 'List Teams',
        docs: {
          description: 'List all teams.',
          tags: ['Teams'],
          auth: true,
        },
      })
      .output(z.array(teamOutputSchema))
      .query(() => dependencies.queryBus.execute(new ListTeamsQuery())),
    membershipsBySeason: protectedProcedure
      .meta({
        name: 'List Team Memberships By Season',
        docs: {
          description: 'List team memberships for one season.',
          tags: ['Teams'],
          auth: true,
        },
      })
      .input(z.object({ seasonKey: z.number().int().min(1900).max(3000) }))
      .output(z.array(teamMembershipOutputSchema))
      .query(({ input }) =>
        dependencies.queryBus.execute(
          new ListTeamMembershipsBySeasonQuery(input.seasonKey),
        ),
      ),
    create: protectedProcedure
      .meta({
        name: 'Create Team',
        docs: {
          description: 'Create a team catalog record.',
          tags: ['Teams'],
          auth: true,
        },
      })
      .input(
        z.object({
          name: z.string().min(1),
          imageUrl: z.string().url().nullable().optional(),
        }),
      )
      .output(teamOutputSchema)
      .mutation(({ input }) =>
        dependencies.commandBus.execute(
          new CreateTeamCommand(input.name, input.imageUrl ?? null),
        ),
      ),
    update: protectedProcedure
      .meta({
        name: 'Update Team',
        docs: {
          description: 'Rename a team catalog record.',
          tags: ['Teams'],
          auth: true,
        },
      })
      .input(
        z.object({
          id: z.uuid(),
          name: z.string().min(1),
          imageUrl: z.string().url().nullable().optional(),
        }),
      )
      .output(teamOutputSchema)
      .mutation(({ input }) =>
        dependencies.commandBus.execute(
          new UpdateTeamCommand(input.id, input.name, input.imageUrl),
        ),
      ),
    archive: protectedProcedure
      .meta({
        name: 'Archive Team',
        docs: {
          description: 'Archive a team catalog record.',
          tags: ['Teams'],
          auth: true,
        },
      })
      .input(z.object({ id: z.uuid() }))
      .output(teamOutputSchema)
      .mutation(({ input }) =>
        dependencies.commandBus.execute(new ArchiveTeamCommand(input.id)),
      ),
    assignMember: protectedProcedure
      .meta({
        name: 'Assign Team Member',
        docs: {
          description: 'Assign a user to a team for a season.',
          tags: ['Teams'],
          auth: true,
        },
      })
      .input(
        z.object({
          userId: z.uuid(),
          teamId: z.uuid(),
          seasonKey: z.number().int().min(1900).max(3000).optional(),
          role: teamRoleSchema,
          startedOn: z.iso.date().optional(),
        }),
      )
      .output(teamMembershipOutputSchema)
      .mutation(({ input }) =>
        dependencies.commandBus.execute(
          new AssignTeamMemberCommand(
            input.userId,
            input.teamId,
            input.role,
            input.seasonKey,
            input.startedOn,
          ),
        ),
      ),
    removeMember: protectedProcedure
      .meta({
        name: 'Remove Team Member',
        docs: {
          description: 'Remove a team membership assignment.',
          tags: ['Teams'],
          auth: true,
        },
      })
      .input(z.object({ membershipId: z.uuid() }))
      .output(teamMembershipOutputSchema.nullable())
      .mutation(({ input }) =>
        dependencies.commandBus.execute(
          new RemoveTeamMemberCommand(input.membershipId),
        ),
      ),
  });
}
