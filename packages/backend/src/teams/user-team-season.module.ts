import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTeamSeason } from './entities/user-team-season.entity';
import { UserTeamSeasonService } from './user-team-season.service';
import { SeasonModule } from 'src/season/season.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserTeamSeason]), SeasonModule],
  providers: [UserTeamSeasonService],
  exports: [TypeOrmModule, UserTeamSeasonService],
})
export class UserTeamSeasonModule {}
