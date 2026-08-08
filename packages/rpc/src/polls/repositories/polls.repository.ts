import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager, Repository } from 'typeorm';

import { PollEntity } from '../entities/poll.entity';
import { PollOptionEntity } from '../entities/poll-option.entity';
import { PollResponseEntity } from '../entities/poll-response.entity';

@Injectable()
export class PollsRepository {
  constructor(
    @InjectRepository(PollEntity)
    private readonly polls: Repository<PollEntity>,
    @InjectRepository(PollOptionEntity)
    private readonly options: Repository<PollOptionEntity>,
    @InjectRepository(PollResponseEntity)
    private readonly responses: Repository<PollResponseEntity>,
  ) {}

  findPoll(id: string): Promise<PollEntity | null> {
    return this.polls.findOne({
      where: { id },
      relations: { options: true },
      order: { options: { position: 'ASC' } },
    });
  }

  findPollForUpdate(
    id: string,
    manager: EntityManager,
  ): Promise<PollEntity | null> {
    return manager.getRepository(PollEntity).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
  }

  listOptions(
    pollId: string,
    manager?: EntityManager,
  ): Promise<PollOptionEntity[]> {
    return (manager?.getRepository(PollOptionEntity) ?? this.options).find({
      where: { pollId },
      order: { position: 'ASC' },
    });
  }

  listAll(): Promise<PollEntity[]> {
    return this.polls.find({
      relations: { options: true },
      order: { createdAt: 'DESC', options: { position: 'ASC' } },
    });
  }

  listForMember(userId: string, now: Date): Promise<PollEntity[]> {
    return this.polls
      .createQueryBuilder('poll')
      .leftJoinAndSelect('poll.options', 'option')
      .where('poll.publishedAt IS NOT NULL')
      .andWhere('poll.archivedAt IS NULL')
      .andWhere(
        `((poll.opensAt <= :now AND poll.closesAt > :now) OR EXISTS (
          SELECT 1 FROM poll_responses response
          WHERE response."pollId" = poll.id AND response."userId" = :userId
        ))`,
        { now, userId },
      )
      .orderBy('poll.closesAt', 'DESC')
      .addOrderBy('option.position', 'ASC')
      .getMany();
  }

  findResponse(
    pollId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<PollResponseEntity | null> {
    return (
      manager?.getRepository(PollResponseEntity) ?? this.responses
    ).findOne({
      where: { pollId, userId },
      relations: { selections: true },
    });
  }

  countResponses(pollId: string, manager?: EntityManager): Promise<number> {
    return (
      manager?.getRepository(PollResponseEntity) ?? this.responses
    ).countBy({ pollId });
  }

  findResponses(pollId: string): Promise<PollResponseEntity[]> {
    return this.responses.find({
      where: { pollId },
      relations: { selections: true, user: true },
      order: { submittedAt: 'ASC' },
    });
  }
}
