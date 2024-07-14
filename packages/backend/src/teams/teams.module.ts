import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { UserTeamSeasonModule } from './user-team-season.module';
import { User } from 'src/users/entities/user.entity';
import { SeasonModule } from 'src/season/season.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Team, User]),
    UserTeamSeasonModule,
    SeasonModule,
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
