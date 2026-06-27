import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { ClerkClaims } from '../../auth/auth-context';
import { UserEntity } from '../entities/user.entity';

export type SyncUserInput = {
  clerkUserId: string;
  claims: ClerkClaims;
};

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  findByClerkUserId(clerkUserId: string): Promise<UserEntity | null> {
    return this.repository.findOneBy({ clerkUserId });
  }

  async syncFromClerk(input: SyncUserInput): Promise<UserEntity> {
    const existing = await this.findByClerkUserId(input.clerkUserId);
    const entity = existing ?? this.repository.create();

    entity.clerkUserId = input.clerkUserId;
    entity.email = this.readStringClaim(input.claims, 'email');
    entity.firstName = this.readStringClaim(input.claims, 'first_name');
    entity.lastName = this.readStringClaim(input.claims, 'last_name');
    entity.imageUrl = this.readStringClaim(input.claims, 'image_url');

    return this.repository.save(entity);
  }

  private readStringClaim(
    claims: ClerkClaims,
    key: keyof ClerkClaims,
  ): string | null {
    const value = claims[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
