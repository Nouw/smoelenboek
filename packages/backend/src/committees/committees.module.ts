import { Module } from '@nestjs/common';
import { CommitteesService } from './committees.service';
import { CommitteesController } from './committees.controller';
import { SeasonModule } from 'src/season/season.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Committee } from './entities/committee.entity';
import { UserCommitteesSeasonModule } from './user-committee-season.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    SeasonModule,
    TypeOrmModule.forFeature([Committee, User]),
    UserCommitteesSeasonModule,
  ],
  controllers: [CommitteesController],
  providers: [CommitteesService],
  exports: [CommitteesService],
})
export class CommitteesModule {}
