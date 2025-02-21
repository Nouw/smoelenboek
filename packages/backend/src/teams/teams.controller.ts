import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamPipe } from './pipes/team.pipe';
import { Team } from './entities/team.entity';
import { UserPipe } from 'src/users/pipes/user.pipe';
import { User } from 'src/users/entities/user.entity';
import { UserTeamSeasonService } from './user-team-season.service';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from 'src/auth/enums/role.enum';
import { TeamFunction } from './enums/team-rank.enum';
import { Public } from 'src/auth/decorators/public.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly userTeamSeasonsService: UserTeamSeasonService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Roles(Role.Admin)
  @Post()
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(+id);
  }

  @Roles(Role.Admin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(+id, updateTeamDto);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamsService.remove(+id);
  }

  @Roles(Role.Admin)
  @Post('/user/:teamId/:userId')
  async addUserToTeam(
    @Param('teamId', TeamPipe) team: Team,
    @Param('userId', UserPipe) user: User,
  ) {
    return this.userTeamSeasonsService.addUserToTeam(user, team);
  }

  @Roles(Role.Admin)
  @Patch('user/:teamId/:userId')
  async updateUserToTeam(
    @Param('teamId', TeamPipe) team: Team,
    @Param('userId', UserPipe) user: User,
    @Body('function') func: TeamFunction,
  ) {
    return this.userTeamSeasonsService.updateUserToTeam(user, team, func);
  }

  @Roles(Role.Admin)
  @Delete('user/:teamId/:userId')
  async removeUserToTeam(
    @Param('teamId', TeamPipe) team: Team,
    @Param('userId', UserPipe) user: User,
  ) {
    return this.userTeamSeasonsService.removeUserToTeam(user, team);
  }

  @Roles(Role.Admin)
  @Post('sync-photos')
  async syncPhotos() {
    return this.teamsService.syncPhotos();
  }
}
