import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePropollDto } from './dto/create-propoll.dto';
import { UpdatePropollDto } from './dto/update-propoll.dto';
import { VotePropollDto } from './dto/vote-propoll.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Propoll } from './entities/propoll.entity';
import {
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { PropollVote } from './entities/propoll-vote.entity';
import { PropollOption } from './entities/propoll-option.entity';

@Injectable()
export class PropollService {
  constructor(
    @InjectRepository(Propoll)
    private readonly pollsRepository: Repository<Propoll>,
    @InjectRepository(PropollOption)
    private readonly pollOptionsRepository: Repository<PropollOption>,
    @InjectRepository(PropollVote)
    private readonly pollVotesRepository: Repository<PropollVote>,
  ) {}

  async create(createPropollDto: CreatePropollDto, userId?: number) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    const question = createPropollDto.question.trim();
    const options = [
      ...new Set(
        createPropollDto.options
          .map((option) => option.trim())
          .filter((option) => option.length > 0),
      ),
    ];

    if (!question) {
      throw new BadRequestException('Question cannot be empty');
    }

    if (options.length < 2) {
      throw new BadRequestException('A poll requires at least 2 unique options');
    }

    if (createPropollDto.voteEndAt < createPropollDto.voteStartAt) {
      throw new BadRequestException('Vote end date cannot be before start date');
    }

    const poll = this.pollsRepository.create({
      question,
      allowMultiple: createPropollDto.allowMultiple,
      voteStartAt: createPropollDto.voteStartAt,
      voteEndAt: createPropollDto.voteEndAt,
      options: options.map((text) => this.pollOptionsRepository.create({ text })),
    });

    const savedPoll = await this.pollsRepository.save(poll);

    return this.findOne(savedPoll.id, userId);
  }

  async findAll(userId?: number) {
    const polls = await this.pollsRepository.find({
      relations: {
        options: true,
        votes: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return polls.map((poll) => this.toPollResponse(poll, userId));
  }

  async findActive(userId?: number) {
    const now = new Date();
    const polls = await this.pollsRepository.find({
      where: {
        voteStartAt: LessThanOrEqual(now),
        voteEndAt: MoreThanOrEqual(now),
      },
      relations: {
        options: true,
        votes: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return polls.map((poll) => this.toPollResponse(poll, userId));
  }

  async findOne(id: number, userId?: number) {
    const poll = await this.pollsRepository.findOne({
      where: { id },
      relations: {
        options: true,
        votes: true,
      },
    });

    if (!poll) {
      throw new NotFoundException();
    }

    return this.toPollResponse(poll, userId);
  }

  async update(id: number, updatePropollDto: UpdatePropollDto, userId?: number) {
    const poll = await this.pollsRepository.findOne({
      where: { id },
      relations: {
        options: true,
        votes: true,
      },
    });

    if (!poll) {
      throw new NotFoundException();
    }

    const nextQuestion =
      updatePropollDto.question === undefined
        ? poll.question
        : updatePropollDto.question.trim();

    if (!nextQuestion) {
      throw new BadRequestException('Question cannot be empty');
    }

    const nextAllowMultiple = updatePropollDto.allowMultiple ?? poll.allowMultiple;
    const nextVoteStartAt = updatePropollDto.voteStartAt ?? poll.voteStartAt;
    const nextVoteEndAt = updatePropollDto.voteEndAt ?? poll.voteEndAt;

    if (!nextVoteStartAt || !nextVoteEndAt) {
      throw new BadRequestException('Vote start and end date are required');
    }

    if (nextVoteEndAt < nextVoteStartAt) {
      throw new BadRequestException('Vote end date cannot be before start date');
    }

    const currentOptionsById = new Map(
      poll.options.map((option) => [option.id, option]),
    );
    const nextOptionsPayload = updatePropollDto.options;

    let remainingOptionIds = new Set<number>(poll.options.map((option) => option.id));
    if (nextOptionsPayload) {
      const seenIds = new Set<number>();
      const trimmedOptions = nextOptionsPayload
        .map((option) => ({ id: option.id, text: option.text.trim() }))
        .filter((option) => option.text.length > 0);

      const dedupedTexts = new Set(trimmedOptions.map((option) => option.text));
      if (trimmedOptions.length < 2 || trimmedOptions.length !== dedupedTexts.size) {
        throw new BadRequestException(
          'A poll requires at least 2 unique options',
        );
      }

      for (const option of trimmedOptions) {
        if (!option.id) {
          continue;
        }

        if (seenIds.has(option.id)) {
          throw new BadRequestException('Duplicate option id in request');
        }

        if (!currentOptionsById.has(option.id)) {
          throw new BadRequestException('One or more options do not exist');
        }

        seenIds.add(option.id);
      }

      remainingOptionIds = new Set(
        trimmedOptions
          .filter((option) => option.id !== undefined)
          .map((option) => option.id as number),
      );

      updatePropollDto.options = trimmedOptions;
    }

    if (!nextAllowMultiple) {
      const votesByUser = new Map<number, Set<number>>();
      for (const vote of poll.votes) {
        if (!remainingOptionIds.has(vote.optionId)) {
          continue;
        }

        if (!votesByUser.has(vote.userId)) {
          votesByUser.set(vote.userId, new Set());
        }

        votesByUser.get(vote.userId)!.add(vote.optionId);
      }

      if (Array.from(votesByUser.values()).some((votes) => votes.size > 1)) {
        throw new BadRequestException(
          'Cannot switch to single choice because users already selected multiple options',
        );
      }
    }

    await this.pollsRepository.manager.transaction(async (manager) => {
      poll.question = nextQuestion;
      poll.allowMultiple = nextAllowMultiple;
      poll.voteStartAt = nextVoteStartAt;
      poll.voteEndAt = nextVoteEndAt;
      await manager.save(Propoll, poll);

      if (!updatePropollDto.options) {
        return;
      }

      const keepOptionIds: number[] = [];
      for (const option of updatePropollDto.options) {
        if (option.id) {
          const existing = currentOptionsById.get(option.id)!;
          existing.text = option.text;
          await manager.save(PropollOption, existing);
          keepOptionIds.push(existing.id);
          continue;
        }

        const created = manager.create(PropollOption, {
          pollId: poll.id,
          text: option.text,
        });
        const saved = await manager.save(PropollOption, created);
        keepOptionIds.push(saved.id);
      }

      const toDeleteIds = poll.options
        .map((option) => option.id)
        .filter((optionId) => !keepOptionIds.includes(optionId));

      if (toDeleteIds.length > 0) {
        await manager.delete(PropollOption, {
          pollId: poll.id,
          id: In(toDeleteIds),
        });
      }
    });

    return this.findOne(id, userId);
  }

  async remove(id: number) {
    const poll = await this.pollsRepository.findOneBy({ id });

    if (!poll) {
      throw new NotFoundException();
    }

    await this.pollsRepository.remove(poll);
  }

  async vote(id: number, voteDto: VotePropollDto, userId?: number) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    const optionIds = [...new Set(voteDto.optionIds)];
    const poll = await this.pollsRepository.findOne({
      where: { id },
      relations: {
        options: true,
      },
    });

    if (!poll) {
      throw new NotFoundException();
    }

    if (!poll.allowMultiple && optionIds.length !== 1) {
      throw new BadRequestException('This poll only allows one answer');
    }

    const now = new Date();
    if (
      !poll.voteStartAt ||
      !poll.voteEndAt ||
      poll.voteStartAt > now ||
      poll.voteEndAt < now
    ) {
      throw new BadRequestException('This poll is not active');
    }

    const pollOptionIds = new Set(poll.options.map((option) => option.id));
    if (optionIds.some((optionId) => !pollOptionIds.has(optionId))) {
      throw new BadRequestException('One or more selected options do not exist');
    }

    await this.pollVotesRepository.manager.transaction(async (manager) => {
      await manager.delete(PropollVote, {
        pollId: poll.id,
        userId,
      });

      const votes = optionIds.map((optionId) =>
        manager.create(PropollVote, {
          pollId: poll.id,
          optionId,
          userId,
        }),
      );

      await manager.save(PropollVote, votes);
    });

    return this.findOne(id, userId);
  }

  private toPollResponse(poll: Propoll, userId?: number) {
    const votesByOption = poll.votes.reduce<Record<number, number>>((acc, vote) => {
      acc[vote.optionId] = (acc[vote.optionId] ?? 0) + 1;
      return acc;
    }, {});

    const selectedOptionIds = userId
      ? poll.votes
          .filter((vote) => vote.userId === userId)
          .map((vote) => vote.optionId)
          .sort((a, b) => a - b)
      : [];

    const options = [...poll.options]
      .sort((a, b) => a.id - b.id)
      .map((option) => ({
        id: option.id,
        text: option.text,
        votes: votesByOption[option.id] ?? 0,
      }));

    return {
      id: poll.id,
      question: poll.question,
      allowMultiple: poll.allowMultiple,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      voteStartAt: poll.voteStartAt,
      voteEndAt: poll.voteEndAt,
      totalVotes: poll.votes.length,
      selectedOptionIds,
      options,
    };
  }
}
