import { ConflictException, NotFoundException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

type MembershipState = { id: string; banned: boolean; leaveDate: string | null };

export async function lockUserMembershipState(manager: EntityManager, userId: string): Promise<{ exists: boolean; active: boolean }> {
  const rows = await manager.query(
    `SELECT u."id", u."banned", ui."leaveDate"
     FROM "users" u
     LEFT JOIN "user_information" ui ON ui."userId" = u."id"
     WHERE u."id" = $1
     FOR UPDATE OF u`,
    [userId],
  ) as MembershipState[];
  const user = rows[0];
  return { exists: Boolean(user), active: Boolean(user && !user.banned && user.leaveDate === null) };
}

export async function assertActiveUserForAssignment(manager: EntityManager, userId: string): Promise<void> {
  const state = await lockUserMembershipState(manager, userId);
  if (!state.exists) throw new NotFoundException('User not found.');
  if (!state.active) throw new ConflictException('Inactive users cannot be assigned.');
}
