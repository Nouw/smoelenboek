import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Team } from '../entities/team.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TeamPipe implements PipeTransform {
  constructor(
    @InjectRepository(Team) private readonly repository: Repository<Team>,
  ) {}

  transform(value: any, metadata: ArgumentMetadata): Promise<Team | null> {
    return this.repository.findOneBy({ id: value });
  }
}
