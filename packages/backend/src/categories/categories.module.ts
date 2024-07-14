import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { SeasonModule } from 'src/season/season.module';
import { CategorySubscriber } from './subscribers/category.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), SeasonModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategorySubscriber],
})
export class CategoriesModule {}
