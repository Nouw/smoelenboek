import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { FormModule } from './form/form.module';
import { CommitteesModule } from 'src/committees/committees.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { Committee } from 'src/committees/entities/committee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, Committee]),
    CommitteesModule,
    FormModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
