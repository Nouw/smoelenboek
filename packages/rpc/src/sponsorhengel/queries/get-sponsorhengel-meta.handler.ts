import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SponsorhengelRepository } from '../repositories/sponsorhengel.repository';
import {
  GetSponsorhengelMetaQuery,
  type SponsorhengelMetaDto,
} from './get-sponsorhengel-meta.query';

@Injectable()
@QueryHandler(GetSponsorhengelMetaQuery)
export class GetSponsorhengelMetaHandler
  implements IQueryHandler<GetSponsorhengelMetaQuery, SponsorhengelMetaDto>
{
  constructor(private readonly repository: SponsorhengelRepository) {}

  async execute(): Promise<SponsorhengelMetaDto> {
    const row = await this.repository.find();
    if (!row) return null;
    return { originalName: row.originalName, updatedAt: row.updatedAt };
  }
}
