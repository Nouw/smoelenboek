import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserInformationEntity } from '../entities/user-information.entity';

@Injectable()
export class UserInformationRepository {
  constructor(
    @InjectRepository(UserInformationEntity)
    private readonly repository: Repository<UserInformationEntity>,
  ) {}

  findByUserId(userId: string): Promise<UserInformationEntity | null> {
    return this.repository.findOneBy({ userId });
  }
}
