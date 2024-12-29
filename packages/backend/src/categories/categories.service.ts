import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { SeasonService } from 'src/season/season.service';
import { isBefore } from 'date-fns';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly seasonsService: SeasonService,
    @Inject(REQUEST)
    private readonly request: Request & { user: { joined: string } },
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const category = this.categoriesRepository.create();

    category.name = createCategoryDto.name;
    category.type = createCategoryDto.type;

    return this.categoriesRepository.save(category);
  }

  async findAll() {
    const seasons = await this.seasonsService.findAll();
    const joined = this.request.user.joined;
    const entities = {};
    for (const season of seasons) {
      if (isBefore(season.endDate, joined)) {
        continue;
      }

      entities[season.name] = await this.categoriesRepository
        .createQueryBuilder('c')
        .select(['c'])
        .where('c.created BETWEEN :start AND :end', {
          start: season.startDate,
          end: season.endDate,
        })
        .getMany();
    }

    return entities;
  }

  findOne(id: number) {
    return this.categoriesRepository.findOne({
      where: { id },
      relations: { documents: true },
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoriesRepository.findOneBy({ id });

    if (!category) {
      throw new NotFoundException();
    }

    category.name = updateCategoryDto.name;
    category.type = updateCategoryDto.type;
    category.key = updateCategoryDto.key;

    return this.categoriesRepository.save(category);
  }

  async remove(id: number) {
    const category = await this.categoriesRepository.findOneBy({ id });

    return this.categoriesRepository.remove(category);
  }
}
