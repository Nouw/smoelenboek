import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { EntityManager } from 'typeorm';

import { CommitteeMemberRemovedEvent } from '../../committees/events/committee-events';
import { EmailOutboxRepository } from '../../email/email-outbox.repository';
import { EventStorePublisher } from '../../event-store/event-store.publisher';
import { getLocalDate, getSeasonKey } from '../../seasons/season-policy';
import { TeamMemberRemovedEvent } from '../../teams/events/team-events';
import { UserMembershipStatusChangedEvent } from '../events/user-membership-status-changed.event';
import { UserRoleChangedEvent } from '../events/user-role-changed.event';
import { UserProvisioningService } from '../services/user-provisioning.service';
import { DeregisterManagedUserCommand, ReactivateManagedUserCommand } from './admin-user.commands';

export type ManagedUserStatusResult = { userId: string; leaveDate: string | null; role: 'user' };

type LockedUser = {
  id: string;
  role: string;
  email: string | null;
  name: string;
  preferredLocale: 'nl' | 'en';
  accountActivatedAt: Date | null;
  banned: boolean;
  banReason: string | null;
  leaveDate: string | null;
};

async function lockUsers(manager: EntityManager, actorUserId: string, targetUserId: string): Promise<{
  actor: LockedUser;
  target: LockedUser;
}> {
  await manager.query(`SELECT pg_advisory_xact_lock(hashtext('users.admin-role-change'))`);
  const rows = await manager.query(
    `SELECT u."id", u."role", u."email", u."name", u."preferredLocale", u."accountActivatedAt",
            u."banned", u."banReason", ui."leaveDate"
     FROM "users" u LEFT JOIN "user_information" ui ON ui."userId" = u."id"
     WHERE u."id" IN ($1, $2) ORDER BY u."id" FOR UPDATE OF u`,
    [actorUserId, targetUserId],
  ) as LockedUser[];
  const actor = rows.find((row) => row.id === actorUserId);
  const target = rows.find((row) => row.id === targetUserId);
  if (!actor || actor.role !== 'admin' || actor.leaveDate !== null || actor.banned) {
    throw new ForbiddenException('Active administrator access required.');
  }
  if (!target) throw new NotFoundException('User not found.');
  return { actor, target };
}

@CommandHandler(DeregisterManagedUserCommand)
@Injectable()
export class DeregisterManagedUserHandler implements ICommandHandler<DeregisterManagedUserCommand, ManagedUserStatusResult> {
  private readonly logger = new Logger(DeregisterManagedUserHandler.name);

  constructor(
    private readonly events: EventStorePublisher,
    private readonly outbox: EmailOutboxRepository,
  ) {}

  async execute(command: DeregisterManagedUserCommand): Promise<ManagedUserStatusResult> {
    const now = new Date();
    const leaveDate = getLocalDate(now);
    const currentSeasonKey = getSeasonKey(now);
    let removedTeams = 0;
    let removedCommittees = 0;
    await this.events.appendPreparedBatchAndPublish(async (manager) => {
      const { target } = await lockUsers(manager, command.actorUserId, command.targetUserId);
      if (command.actorUserId === command.targetUserId) {
        throw new ConflictException('Administrators cannot deregister themselves.');
      }
      if (target.leaveDate !== null) throw new ConflictException('User is already inactive.');
      if (target.role === 'admin' && !target.banned) {
        const rows = await manager.query(
          `SELECT COUNT(*)::int AS "count" FROM "users" u
           LEFT JOIN "user_information" ui ON ui."userId" = u."id"
           WHERE u."role" = 'admin' AND ui."leaveDate" IS NULL AND u."banned" = false`,
        ) as Array<{ count: number }>;
        if ((rows[0]?.count ?? 0) <= 1) throw new ConflictException('The final active administrator cannot be deregistered.');
      }

      const teamRows = await manager.query(
        `SELECT "id" FROM "team_memberships" WHERE "userId" = $1 AND "seasonKey" >= $2 AND "endedOn" IS NULL ORDER BY "id" FOR UPDATE`,
        [target.id, currentSeasonKey],
      ) as Array<{ id: string }>;
      const committeeRows = await manager.query(
        `SELECT "id" FROM "committee_memberships" WHERE "userId" = $1 AND "seasonKey" >= $2 AND "endedOn" IS NULL ORDER BY "id" FOR UPDATE`,
        [target.id, currentSeasonKey],
      ) as Array<{ id: string }>;
      removedTeams = teamRows.length;
      removedCommittees = committeeRows.length;

      await manager.query(
        `INSERT INTO "user_information" ("userId", "leaveDate") VALUES ($1, $2)
         ON CONFLICT ("userId") DO UPDATE SET "leaveDate" = EXCLUDED."leaveDate", "updatedAt" = now()`,
        [target.id, leaveDate],
      );
      await manager.query(
        `UPDATE "users" SET "role" = 'user', "banned" = true,
         "banReason" = CASE WHEN "banned" THEN "banReason" ELSE 'membership ended' END,
         "banExpires" = NULL, "updatedAt" = now() WHERE "id" = $1`,
        [target.id],
      );
      await manager.query(`DELETE FROM "session" WHERE "userId" = $1`, [target.id]);
      await manager.query(`UPDATE "apikey" SET "enabled" = false, "updatedAt" = now() WHERE "referenceId" = $1`, [target.id]);
      await manager.query(`DELETE FROM "verification" WHERE "value" = $1 AND "identifier" LIKE 'reset-password:%'`, [target.id]);
      await this.outbox.cancelPendingAccessMessages(target.id, manager);
      await manager.query(`DELETE FROM "team_memberships" WHERE "userId" = $1 AND "seasonKey" >= $2 AND "endedOn" IS NULL`, [target.id, currentSeasonKey]);
      await manager.query(`DELETE FROM "committee_memberships" WHERE "userId" = $1 AND "seasonKey" >= $2 AND "endedOn" IS NULL`, [target.id, currentSeasonKey]);

      return [
        ...teamRows.map(({ id }) => TeamMemberRemovedEvent.create({ membershipId: id }, command.actorUserId)),
        ...committeeRows.map(({ id }) => CommitteeMemberRemovedEvent.create({ membershipId: id }, command.actorUserId)),
        ...(target.role === 'admin' ? [UserRoleChangedEvent.create({ userId: target.id, role: 'user' }, command.actorUserId)] : []),
        UserMembershipStatusChangedEvent.create({ userId: target.id, leaveDate }, command.actorUserId),
      ];
    });
    this.logger.log(JSON.stringify({ event: 'users.deregistered', userId: command.targetUserId, actorUserId: command.actorUserId, removedTeams, removedCommittees }));
    return { userId: command.targetUserId, leaveDate, role: 'user' };
  }
}

@CommandHandler(ReactivateManagedUserCommand)
@Injectable()
export class ReactivateManagedUserHandler implements ICommandHandler<ReactivateManagedUserCommand, ManagedUserStatusResult> {
  private readonly logger = new Logger(ReactivateManagedUserHandler.name);

  constructor(
    private readonly events: EventStorePublisher,
    private readonly provisioning: UserProvisioningService,
  ) {}

  async execute(command: ReactivateManagedUserCommand): Promise<ManagedUserStatusResult> {
    await this.events.appendPreparedBatchAndPublish(async (manager) => {
      const { target } = await lockUsers(manager, command.actorUserId, command.targetUserId);
      if (target.leaveDate === null) throw new ConflictException('User is already active.');
      await manager.query(
        `UPDATE "user_information" SET "leaveDate" = NULL, "updatedAt" = now() WHERE "userId" = $1`,
        [target.id],
      );
      await manager.query(
        `UPDATE "users" SET "role" = 'user', "banned" = false, "banReason" = NULL,
         "banExpires" = NULL, "updatedAt" = now() WHERE "id" = $1`,
        [target.id],
      );
      if (!target.accountActivatedAt) {
        if (!target.email) throw new ConflictException('User has no email address for a new invitation.');
        await this.provisioning.queueReactivationInvitation({
          id: target.id, email: target.email, name: target.name, preferredLocale: target.preferredLocale,
        }, manager);
      }
      return [
        ...(target.role === 'user' ? [] : [UserRoleChangedEvent.create({ userId: target.id, role: 'user' }, command.actorUserId)]),
        UserMembershipStatusChangedEvent.create({ userId: target.id, leaveDate: null }, command.actorUserId),
      ];
    });
    this.logger.log(JSON.stringify({ event: 'users.reactivated', userId: command.targetUserId, actorUserId: command.actorUserId }));
    return { userId: command.targetUserId, leaveDate: null, role: 'user' };
  }
}
