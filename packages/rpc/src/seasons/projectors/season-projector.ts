import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { SeasonEntity } from '../entities/season.entity';
import type { SeasonSnapshotPayload } from '../events/season-events';

@Injectable()
export class SeasonProjector {
  async projectSnapshot(
    payload: SeasonSnapshotPayload,
    manager: EntityManager,
  ): Promise<SeasonEntity> {
    const startsAt = new Date(payload.startsAt);
    const endsAt = new Date(payload.endsAt);

    if (startsAt >= endsAt) {
      throw new BadRequestException('Season start must be before season end.');
    }

    const repository = manager.getRepository(SeasonEntity);
    const overlapping = await repository
      .createQueryBuilder('season')
      .where('season.id != :seasonId', { seasonId: payload.seasonId })
      .andWhere('season.startsAt <= :endsAt', { endsAt })
      .andWhere('season.endsAt >= :startsAt', { startsAt })
      .getOne();

    if (overlapping) {
      throw new BadRequestException('Season date range overlaps another season.');
    }

    const existing = await repository.findOneBy({ id: payload.seasonId });
    const entity = existing ?? repository.create({ id: payload.seasonId });

    entity.name = payload.name;
    entity.startsAt = startsAt;
    entity.endsAt = endsAt;

    return repository.save(entity);
  }
}

