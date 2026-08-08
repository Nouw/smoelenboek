import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { PollAdminResultDto, PollDto } from '@repo/api';

import { toAdminResultOutput, toPollOutput } from '../dto/poll-output';
import { PollsRepository } from '../repositories/polls.repository';
import {
  GetAdminPollQuery,
  GetPollResultsQuery,
  ListAdminPollsQuery,
  ListMemberPollsQuery,
} from './poll.queries';

@QueryHandler(ListMemberPollsQuery)
export class ListMemberPollsHandler
  implements IQueryHandler<ListMemberPollsQuery, PollDto[]>
{
  constructor(private readonly repository: PollsRepository) {}

  async execute(query: ListMemberPollsQuery): Promise<PollDto[]> {
    const polls = await this.repository.listForMember(query.userId, query.now);
    return Promise.all(
      polls.map(async (poll) => {
        const response = await this.repository.findResponse(
          poll.id,
          query.userId,
        );
        return toPollOutput(
          poll,
          response?.selections.map((selection) => selection.optionId) ?? [],
          query.now,
        );
      }),
    );
  }
}

@QueryHandler(ListAdminPollsQuery)
export class ListAdminPollsHandler
  implements IQueryHandler<ListAdminPollsQuery, PollDto[]>
{
  constructor(private readonly repository: PollsRepository) {}
  async execute(query: ListAdminPollsQuery): Promise<PollDto[]> {
    return (await this.repository.listAll()).map((poll) =>
      toPollOutput(poll, [], query.now),
    );
  }
}

@QueryHandler(GetAdminPollQuery)
export class GetAdminPollHandler
  implements IQueryHandler<GetAdminPollQuery, PollDto | null>
{
  constructor(private readonly repository: PollsRepository) {}
  async execute(query: GetAdminPollQuery): Promise<PollDto | null> {
    const poll = await this.repository.findPoll(query.pollId);
    return poll ? toPollOutput(poll, [], query.now) : null;
  }
}

@QueryHandler(GetPollResultsQuery)
export class GetPollResultsHandler
  implements IQueryHandler<GetPollResultsQuery, PollAdminResultDto>
{
  constructor(private readonly repository: PollsRepository) {}
  async execute(query: GetPollResultsQuery): Promise<PollAdminResultDto> {
    const poll = await this.repository.findPoll(query.pollId);
    if (!poll) throw new NotFoundException('Poll not found.');
    return toAdminResultOutput(
      poll,
      await this.repository.findResponses(poll.id),
      query.now,
    );
  }
}
