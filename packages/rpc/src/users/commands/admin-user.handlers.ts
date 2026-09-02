import type { ManagedUserDto, ManagedUserRole } from '@repo/api';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { EventStorePublisher } from '../../event-store/event-store.publisher';
import { UserRoleChangedEvent } from '../events/user-role-changed.event';
import { UserProvisioningService } from '../services/user-provisioning.service';
import {
  CreateManagedUserCommand,
  ResendUserInvitationCommand,
  SetManagedUserRoleCommand,
} from './admin-user.commands';

@CommandHandler(CreateManagedUserCommand)
export class CreateManagedUserHandler implements ICommandHandler<CreateManagedUserCommand, ManagedUserDto> {
  constructor(private readonly provisioning: UserProvisioningService) {}
  execute(command: CreateManagedUserCommand): Promise<ManagedUserDto> { return this.provisioning.create(command.input, command.actorUserId); }
}
@CommandHandler(ResendUserInvitationCommand)
export class ResendUserInvitationHandler implements ICommandHandler<ResendUserInvitationCommand, { queued: true }> {
  constructor(private readonly provisioning: UserProvisioningService) {}
  execute(command: ResendUserInvitationCommand): Promise<{ queued: true }> { return this.provisioning.resend(command.userId); }
}

export type ManagedUserRoleResult = {
  userId: string;
  role: ManagedUserRole;
};

type RoleRow = { id: string; role: string };

@CommandHandler(SetManagedUserRoleCommand)
export class SetManagedUserRoleHandler
  implements ICommandHandler<SetManagedUserRoleCommand, ManagedUserRoleResult>
{
  constructor(private readonly eventStorePublisher: EventStorePublisher) {}

  async execute(
    command: SetManagedUserRoleCommand,
  ): Promise<ManagedUserRoleResult> {
    const event = UserRoleChangedEvent.create(
      { userId: command.targetUserId, role: command.role },
      command.actorUserId,
    );

    await this.eventStorePublisher.appendPreparedAndPublish(async (manager) => {
      await manager.query(
        `SELECT pg_advisory_xact_lock(hashtext('users.admin-role-change'))`,
      );

      const rows = (await manager.query(
        `SELECT "id", "role" FROM "users" WHERE "id" IN ($1, $2) FOR UPDATE`,
        [command.actorUserId, command.targetUserId],
      )) as RoleRow[];
      const actor = rows.find((row) => row.id === command.actorUserId);
      const target = rows.find((row) => row.id === command.targetUserId);

      if (!actor || actor.role !== 'admin') {
        throw new ForbiddenException('Administrator access is required.');
      }
      if (!target) {
        throw new NotFoundException('User not found.');
      }
      if (
        command.role === 'user' &&
        command.actorUserId === command.targetUserId
      ) {
        throw new ConflictException(
          'Administrators cannot revoke their own administrator rights.',
        );
      }
      if (command.role === 'user' && target.role === 'admin') {
        const countRows = (await manager.query(
          `SELECT COUNT(*)::int AS "count" FROM "users" WHERE "role" = 'admin'`,
        )) as Array<{ count: number }>;
        const count = countRows[0]?.count ?? 0;
        if (count <= 1) {
          throw new ConflictException(
            'The final administrator cannot be revoked.',
          );
        }
      }

      await manager.query(
        `UPDATE "users" SET "role" = $2, "updatedAt" = now() WHERE "id" = $1`,
        [command.targetUserId, command.role],
      );
      return event;
    });

    return { userId: command.targetUserId, role: command.role };
  }
}
