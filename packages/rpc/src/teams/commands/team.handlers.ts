import type { TeamDto, TeamMembershipDto } from '@repo/api';
import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStoreRepository } from '../../event-store/repositories/event-store.repository';
import { toTeamDto, toTeamMembershipDto } from '../dto/team-output';
import {
  createTeamArchivedEvent,
  createTeamCreatedEvent,
  createTeamMemberAssignedEvent,
  createTeamMemberRemovedEvent,
  createTeamUpdatedEvent,
} from '../events/team-events';
import { TeamProjector } from '../projectors/team-projector';
import { TeamsRepository } from '../repositories/teams.repository';
import {
  ArchiveTeamCommand,
  AssignTeamMemberCommand,
  CreateTeamCommand,
  RemoveTeamMemberCommand,
  UpdateTeamCommand,
} from './team.commands';

@CommandHandler(CreateTeamCommand)
export class CreateTeamHandler
  implements ICommandHandler<CreateTeamCommand, TeamDto>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly teamProjector: TeamProjector,
  ) {}

  async execute(command: CreateTeamCommand): Promise<TeamDto> {
    const event = createTeamCreatedEvent({
      teamId: randomUUID(),
      name: command.name,
      archivedAt: null,
    });
    const team = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.teamProjector.projectTeamSnapshot(event.payload, manager),
    );

    return toTeamDto(team);
  }
}

@CommandHandler(UpdateTeamCommand)
export class UpdateTeamHandler
  implements ICommandHandler<UpdateTeamCommand, TeamDto>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly teamProjector: TeamProjector,
    private readonly teamsRepository: TeamsRepository,
  ) {}

  async execute(command: UpdateTeamCommand): Promise<TeamDto> {
    const existing = await this.teamsRepository.findById(command.id);

    if (!existing) {
      throw new NotFoundException('Team not found.');
    }

    const event = createTeamUpdatedEvent({
      teamId: command.id,
      name: command.name,
      archivedAt: existing.archivedAt?.toISOString() ?? null,
    });
    const team = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.teamProjector.projectTeamSnapshot(event.payload, manager),
    );

    return toTeamDto(team);
  }
}

@CommandHandler(ArchiveTeamCommand)
export class ArchiveTeamHandler
  implements ICommandHandler<ArchiveTeamCommand, TeamDto>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly teamProjector: TeamProjector,
    private readonly teamsRepository: TeamsRepository,
  ) {}

  async execute(command: ArchiveTeamCommand): Promise<TeamDto> {
    const existing = await this.teamsRepository.findById(command.id);

    if (!existing) {
      throw new NotFoundException('Team not found.');
    }

    const event = createTeamArchivedEvent({
      teamId: command.id,
      name: existing.name,
      archivedAt: new Date().toISOString(),
    });
    const team = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.teamProjector.projectTeamSnapshot(event.payload, manager),
    );

    return toTeamDto(team);
  }
}

@CommandHandler(AssignTeamMemberCommand)
export class AssignTeamMemberHandler
  implements ICommandHandler<AssignTeamMemberCommand, TeamMembershipDto>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly teamProjector: TeamProjector,
  ) {}

  async execute(command: AssignTeamMemberCommand): Promise<TeamMembershipDto> {
    const event = createTeamMemberAssignedEvent({
      membershipId: randomUUID(),
      userId: command.userId,
      teamId: command.teamId,
      seasonId: command.seasonId,
      role: command.role,
    });
    const membership = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.teamProjector.projectMemberAssigned(event.payload, manager),
    );

    return toTeamMembershipDto(membership);
  }
}

@CommandHandler(RemoveTeamMemberCommand)
export class RemoveTeamMemberHandler
  implements ICommandHandler<RemoveTeamMemberCommand, TeamMembershipDto | null>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly teamProjector: TeamProjector,
  ) {}

  async execute(
    command: RemoveTeamMemberCommand,
  ): Promise<TeamMembershipDto | null> {
    const event = createTeamMemberRemovedEvent({
      membershipId: command.membershipId,
      userId: '',
      teamId: '',
      seasonId: '',
      role: 'coach_trainer',
    });
    const membership = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.teamProjector.projectMemberRemoved(event.payload, manager),
    );

    return membership ? toTeamMembershipDto(membership) : null;
  }
}

