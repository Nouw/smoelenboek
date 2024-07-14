import { Module } from '@nestjs/common';
import { SeasonModule } from 'src/season/season.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCommitteeSeasonService } from './user-committee-season.service';
import { UserCommitteeSeason } from './entities/user-committee-season.entity';

@Module({
  imports: [SeasonModule, TypeOrmModule.forFeature([UserCommitteeSeason])],
  providers: [UserCommitteeSeasonService],
  exports: [UserCommitteeSeasonService],
})
export class UserCommitteesSeasonModule {}
