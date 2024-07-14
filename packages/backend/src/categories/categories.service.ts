import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { SeasonService } from 'src/season/season.service';
import { isAfter, isBefore } from 'date-fns';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly seasonsService: SeasonService,
    @Inject(REQUEST)
    private readonly request: Request,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const category = this.categoriesRepository.create();

    category.name = createCategoryDto.name;
    category.type = createCategoryDto.type;

    return this.categoriesRepository.save(category);
  }

  async findAll() {
    const categories = await this.categoriesRepository.find();
    const seasons = await this.seasonsService.findAll();

    const entities = {};

    for (const category of categories) {
      //@ts-expect-error should add the user key to the express request type
      if (!isBefore(this.request.user.joined, category.created)) {
        continue;
      }

      const season = seasons.find(
        (s) =>
          isAfter(category.created, s.startDate) &&
          isBefore(category.created, s.endDate),
      );

      if (!season) {
        continue;
      }

      if (!entities[season.name]) {
        entities[season.name] = [category];
      } else {
        entities[season.name].push(category);
      }
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
