import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommitteeDto } from './dto/create-committee.dto';
import { UpdateCommitteeDto } from './dto/update-committee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Committee } from './entities/committee.entity';
import { Repository } from 'typeorm';
import { SeasonService } from 'src/season/season.service';

@Injectable()
export class CommitteesService {
  constructor(
    @InjectRepository(Committee)
    private readonly committeesRepository: Repository<Committee>,
    private readonly seasonsService: SeasonService,
  ) {}

  create(createCommitteeDto: CreateCommitteeDto) {
    const committee = new Committee();

    committee.name = createCommitteeDto.name;
    committee.email = createCommitteeDto.email;

    return this.committeesRepository.save(createCommitteeDto);
  }

  findAll() {
    return this.committeesRepository.find();
  }

  async findOne(id: number) {
    const currentSeason = await this.seasonsService.getCurrentSeason();

    return this.committeesRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect(
        'c.userCommitteeSeason',
        'ucs',
        'ucs.committeeId = c.id AND ucs.seasonId = :seasonId',
        { seasonId: currentSeason.id },
      )
      .leftJoinAndSelect('ucs.user', 'u')
      .select(['c', 'u.firstName', 'u.lastName', 'u.id', 'ucs.function'])
      .where('c.id = :committeeId', { committeeId: id })
      .getOne();
  }

  async update(id: number, updateCommitteeDto: UpdateCommitteeDto) {
    const committee = await this.committeesRepository.findOneBy({ id });

    if (!committee) {
      throw new NotFoundException();
    }

    committee.name = updateCommitteeDto.name;
    committee.email = updateCommitteeDto.email;

    return this.committeesRepository.save(committee);
  }

  remove(id: number) {
    return this.committeesRepository.delete({ id });
  }
}
