import type { UserDto } from '@repo/api';

import type { UserEntity } from '../entities/user.entity';

export function toUserDto(user: UserEntity): UserDto {
  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
