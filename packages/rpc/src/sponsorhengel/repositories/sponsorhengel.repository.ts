import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SponsorhengelEntity } from '../entities/sponsorhengel.entity';

@Injectable()
export class SponsorhengelRepository {
  constructor(
    @InjectRepository(SponsorhengelEntity)
    private readonly repository: Repository<SponsorhengelEntity>,
  ) {}

  find(): Promise<SponsorhengelEntity | null> {
    return this.repository.findOneBy({ id: 'singleton' });
  }

  async upsert(data: {
    objectName: string;
    originalName: string;
    mimeType: string;
    byteSize: number;
  }): Promise<string | null> {
    const existing = await this.find();
    const oldObjectName = existing?.objectName ?? null;

    await this.repository.save({
      id: 'singleton',
      ...data,
    });

    return oldObjectName !== data.objectName ? oldObjectName : null;
  }
}
