import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { z } from 'zod';

import { adminProcedure, protectedProcedure, router } from '../../trpc/init';
import {
  ArchiveTeamCommand,
  AssignTeamMemberCommand,
  CreateTeamCommand,
  RemoveTeamMemberCommand,
  RestoreTeamCommand,
  UpdateTeamCommand,
} from '../commands/team.commands';
import { TEAM_ROLES } from '../team-catalog';
import {
  GetCurrentTeamRosterQuery,
  GetTeamRosterForSeasonQuery,
  ListTeamMembershipsBySeasonQuery,
  ListTeamsQuery,
} from '../queries/team.queries';

export type TeamRouterDependencies = {
  commandBus: CommandBus;
  queryBus: QueryBus;
};

const teamRoleSchema = z.enum(TEAM_ROLES);
const teamCategorySchema = z.enum(['men', 'women']);

const teamOutputSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  category: teamCategorySchema,
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

const teamRosterMemberOutputSchema = z.object({
  userId: z.uuid(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  role: teamRoleSchema,
});

const currentTeamRosterOutputSchema = z.object({
  team: teamOutputSchema,
  season: z.object({
    key: z.number().int().min(1900).max(3000),
    label: z.string(),
    startsOn: z.iso.date(),
    endsBefore: z.iso.date(),
  }),
  coaches: z.array(teamRosterMemberOutputSchema),
  players: z.array(teamRosterMemberOutputSchema),
});

const teamRosterMembershipOutputSchema = teamMembershipOutputSchema.extend({
  user: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email().nullable(),
    imageUrl: z.string().nullable(),
  }),
});

const teamRosterForSeasonOutputSchema = z.object({
  team: teamOutputSchema,
  season: z.object({
    key: z.number().int().min(1900).max(3000),
    label: z.string(),
    startsOn: z.iso.date(),
    endsBefore: z.iso.date(),
  }),
  memberships: z.array(teamRosterMembershipOutputSchema),
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
    currentRoster: protectedProcedure
      .meta({
        name: 'Get Current Team Roster',
        docs: {
          description: 'Get one team and its active current-season roster.',
          tags: ['Teams'],
          auth: true,
        },
      })
      .input(z.object({ teamId: z.uuid() }))
      .output(currentTeamRosterOutputSchema.nullable())
      .query(({ input }) =>
        dependencies.queryBus.execute(
          new GetCurrentTeamRosterQuery(input.teamId, new Date()),
        ),
      ),
    membershipsBySeason: adminProcedure
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
    rosterForSeason: adminProcedure
      .meta({
        name: 'Get Team Roster For Season',
        docs: {
          description:
            'Get one team and its active and ended memberships for an administrator-selected season.',
          tags: ['Teams'],
          auth: true,
        },
      })
      .input(
        z.object({
          teamId: z.uuid(),
          seasonKey: z.number().int().min(1900).max(3000),
        }),
      )
      .output(teamRosterForSeasonOutputSchema.nullable())
      .query(({ input }) =>
        dependencies.queryBus.execute(
          new GetTeamRosterForSeasonQuery(input.teamId, input.seasonKey),
        ),
      ),
    create: adminProcedure
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
          name: z.string().trim().min(1).max(100),
          category: teamCategorySchema,
          imageUrl: z.string().url().nullable().optional(),
        }),
      )
      .output(teamOutputSchema)
      .mutation(({ ctx, input }) =>
        dependencies.commandBus.execute(
          new CreateTeamCommand(
            input.name,
            input.category,
            ctx.userId,
            input.imageUrl ?? null,
          ),
        ),
      ),
    update: adminProcedure
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
          name: z.string().trim().min(1).max(100),
          category: teamCategorySchema,
          imageUrl: z.string().url().nullable().optional(),
        }),
      )
      .output(teamOutputSchema)
      .mutation(({ ctx, input }) =>
        dependencies.commandBus.execute(
          new UpdateTeamCommand(
            input.id,
            input.name,
            input.category,
            ctx.userId,
            input.imageUrl,
          ),
        ),
      ),
    archive: adminProcedure
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
      .mutation(({ ctx, input }) =>
        dependencies.commandBus.execute(
          new ArchiveTeamCommand(input.id, ctx.userId),
        ),
      ),
    restore: adminProcedure
      .meta({
        name: 'Restore Team',
        docs: {
          description: 'Restore an archived team catalog record.',
          tags: ['Teams'],
          auth: true,
        },
      })
      .input(z.object({ id: z.uuid() }))
      .output(teamOutputSchema)
      .mutation(({ ctx, input }) =>
        dependencies.commandBus.execute(
          new RestoreTeamCommand(input.id, ctx.userId),
        ),
      ),
    assignMember: adminProcedure
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
          seasonKey: z.number().int().min(1900).max(3000),
          role: teamRoleSchema,
          startedOn: z.iso.date(),
        }),
      )
      .output(teamMembershipOutputSchema)
      .mutation(({ ctx, input }) =>
        dependencies.commandBus.execute(
          new AssignTeamMemberCommand(
            input.userId,
            input.teamId,
            input.role,
            input.seasonKey,
            input.startedOn,
            ctx.userId,
          ),
        ),
      ),
    removeMember: adminProcedure
      .meta({
        name: 'Remove Team Member',
        docs: {
          description: 'Remove a team membership assignment.',
          tags: ['Teams'],
          auth: true,
        },
      })
      .input(z.object({ membershipId: z.uuid() }))
      .output(teamMembershipOutputSchema)
      .mutation(({ ctx, input }) =>
        dependencies.commandBus.execute(
          new RemoveTeamMemberCommand(input.membershipId, ctx.userId),
        ),
      ),
  });
}
