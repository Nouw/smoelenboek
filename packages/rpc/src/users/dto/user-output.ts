import type { UserDto, UserSummaryDto } from '@repo/api';

import type { UserEntity } from '../entities/user.entity';

export function toUserDto(user: UserEntity): UserDto {
  return {
    id: user.id,
    authUserId: user.authUserId,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toUserSummaryDto(user: UserEntity): UserSummaryDto {
  return {
    id: user.id,
    name: displayUserName(user),
    email: user.email,
    imageUrl: user.imageUrl,
  };
}

export function displayUserName(user: UserEntity): string {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.name ||
    user.email ||
    'Member'
  );
}
