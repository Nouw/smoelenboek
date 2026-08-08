import type { TeamDto, TeamMembershipDto } from '@repo/api';
import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStorePublisher } from '../../event-store/event-store.publisher';
import { resolveMembershipStart } from '../../seasons/season-policy';
import { UsersRepository } from '../../users/repositories/users.repository';
import { toTeamDto, toTeamMembershipDto } from '../dto/team-output';
import {
  TeamArchivedEvent,
  TeamCreatedEvent,
  TeamMemberAssignedEvent,
  TeamMemberRemovedEvent,
  TeamRestoredEvent,
  TeamUpdatedEvent,
} from '../events/team-events';
import { TeamsRepository } from '../repositories/teams.repository';
import {
  ArchiveTeamCommand,
  AssignTeamMemberCommand,
  CreateTeamCommand,
  RemoveTeamMemberCommand,
  RestoreTeamCommand,
  UpdateTeamCommand,
} from './team.commands';

@CommandHandler(CreateTeamCommand)
export class CreateTeamHandler
  implements ICommandHandler<CreateTeamCommand, TeamDto>
{
  private readonly logger = new Logger(CreateTeamHandler.name);

  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly teamsRepository: TeamsRepository,
  ) {}

  async execute(command: CreateTeamCommand): Promise<TeamDto> {
    const duplicate = await this.teamsRepository.findByNameCaseInsensitive(
      command.name,
    );

    if (duplicate) {
      throw new ConflictException('A team with this name already exists.');
    }

    const event = TeamCreatedEvent.create(
      {
        teamId: randomUUID(),
        name: command.name,
        category: command.category,
        imageUrl: command.imageUrl,
        archivedAt: null,
      },
      command.actorUserId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const team = await this.teamsRepository.findById(event.payload.teamId);

    if (!team) {
      throw new Error('Team projection missing after dispatch.');
    }

    this.logger.log({
      event: 'team_created',
      teamId: team.id,
      actorUserId: command.actorUserId,
    });

    return toTeamDto(team);
  }
}

@CommandHandler(UpdateTeamCommand)
export class UpdateTeamHandler
  implements ICommandHandler<UpdateTeamCommand, TeamDto>
{
  private readonly logger = new Logger(UpdateTeamHandler.name);

  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly teamsRepository: TeamsRepository,
  ) {}

  async execute(command: UpdateTeamCommand): Promise<TeamDto> {
    const existing = await this.teamsRepository.findById(command.id);

    if (!existing) {
      throw new NotFoundException('Team not found.');
    }

    const duplicate = await this.teamsRepository.findByNameCaseInsensitive(
      command.name,
    );

    if (duplicate && duplicate.id !== command.id) {
      throw new ConflictException('A team with this name already exists.');
    }

    const event = TeamUpdatedEvent.create(
      {
        teamId: command.id,
        name: command.name,
        category: command.category,
        imageUrl:
          command.imageUrl === undefined ? existing.imageUrl : command.imageUrl,
        archivedAt: existing.archivedAt?.toISOString() ?? null,
      },
      command.actorUserId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const team = await this.teamsRepository.findById(command.id);

    if (!team) {
      throw new Error('Team projection missing after dispatch.');
    }

    this.logger.log({
      event: 'team_updated',
      teamId: team.id,
      actorUserId: command.actorUserId,
    });

    return toTeamDto(team);
  }
}

@CommandHandler(ArchiveTeamCommand)
export class ArchiveTeamHandler
  implements ICommandHandler<ArchiveTeamCommand, TeamDto>
{
  private readonly logger = new Logger(ArchiveTeamHandler.name);

  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly teamsRepository: TeamsRepository,
  ) {}

  async execute(command: ArchiveTeamCommand): Promise<TeamDto> {
    const existing = await this.teamsRepository.findById(command.id);

    if (!existing) {
      throw new NotFoundException('Team not found.');
    }

    if (existing.archivedAt) {
      return toTeamDto(existing);
    }

    const event = TeamArchivedEvent.create(
      {
        teamId: command.id,
        name: existing.name,
        category: existing.category,
        imageUrl: existing.imageUrl,
        archivedAt: new Date().toISOString(),
      },
      command.actorUserId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const team = await this.teamsRepository.findById(command.id);

    if (!team) {
      throw new Error('Team projection missing after dispatch.');
    }

    this.logger.log({
      event: 'team_archived',
      teamId: team.id,
      actorUserId: command.actorUserId,
    });

    return toTeamDto(team);
  }
}

@CommandHandler(RestoreTeamCommand)
export class RestoreTeamHandler
  implements ICommandHandler<RestoreTeamCommand, TeamDto>
{
  private readonly logger = new Logger(RestoreTeamHandler.name);

  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly teamsRepository: TeamsRepository,
  ) {}

  async execute(command: RestoreTeamCommand): Promise<TeamDto> {
    const existing = await this.teamsRepository.findById(command.id);

    if (!existing) {
      throw new NotFoundException('Team not found.');
    }

    if (!existing.archivedAt) {
      return toTeamDto(existing);
    }

    const event = TeamRestoredEvent.create(
      {
        teamId: existing.id,
        name: existing.name,
        category: existing.category,
        imageUrl: existing.imageUrl,
        archivedAt: null,
      },
      command.actorUserId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const team = await this.teamsRepository.findById(command.id);

    if (!team) {
      throw new Error('Team projection missing after dispatch.');
    }

    this.logger.log({
      event: 'team_restored',
      teamId: team.id,
      actorUserId: command.actorUserId,
    });

    return toTeamDto(team);
  }
}

@CommandHandler(AssignTeamMemberCommand)
export class AssignTeamMemberHandler
  implements ICommandHandler<AssignTeamMemberCommand, TeamMembershipDto>
{
  private readonly logger = new Logger(AssignTeamMemberHandler.name);

  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly teamsRepository: TeamsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(command: AssignTeamMemberCommand): Promise<TeamMembershipDto> {
    const [team, user, duplicate] = await Promise.all([
      this.teamsRepository.findById(command.teamId),
      this.usersRepository.findById(command.userId),
      this.teamsRepository.findActiveAssignment(
        command.userId,
        command.teamId,
        command.seasonKey,
        command.role,
      ),
    ]);

    if (!team) {
      throw new NotFoundException('Team not found.');
    }
    if (team.archivedAt) {
      throw new ConflictException(
        'Restore this team before assigning members.',
      );
    }
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (duplicate) {
      throw new ConflictException(
        'This user already has this active team role for the selected season.',
      );
    }

    let startedOn: string;
    try {
      startedOn = resolveMembershipStart(command.seasonKey, command.startedOn);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Invalid membership start date.',
      );
    }

    const membershipId = randomUUID();
    const event = TeamMemberAssignedEvent.create(
      {
        membershipId,
        userId: command.userId,
        teamId: command.teamId,
        seasonKey: command.seasonKey,
        role: command.role,
        startedOn,
        endedOn: null,
      },
      command.actorUserId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const membership = await this.teamsRepository.findMembershipById(membershipId);

    if (!membership) {
      throw new Error('Membership projection missing after dispatch.');
    }

    this.logger.log({
      event: 'team_member_assigned',
      membershipId: membership.id,
      teamId: membership.teamId,
      userId: membership.userId,
      seasonKey: membership.seasonKey,
      role: membership.role,
      actorUserId: command.actorUserId,
    });

    return toTeamMembershipDto(membership);
  }
}

@CommandHandler(RemoveTeamMemberCommand)
export class RemoveTeamMemberHandler
  implements ICommandHandler<RemoveTeamMemberCommand, TeamMembershipDto>
{
  private readonly logger = new Logger(RemoveTeamMemberHandler.name);

  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly teamsRepository: TeamsRepository,
  ) {}

  async execute(command: RemoveTeamMemberCommand): Promise<TeamMembershipDto> {
    const existing = await this.teamsRepository.findMembershipById(
      command.membershipId,
    );

    if (!existing) {
      throw new NotFoundException('Team membership not found.');
    }

    const event = TeamMemberRemovedEvent.create(
      { membershipId: command.membershipId },
      command.actorUserId,
    );
    await this.eventStorePublisher.appendAndPublish(event);

    this.logger.log({
      event: 'team_membership_removed',
      membershipId: existing.id,
      actorUserId: command.actorUserId,
    });

    return toTeamMembershipDto(existing);
  }
}
