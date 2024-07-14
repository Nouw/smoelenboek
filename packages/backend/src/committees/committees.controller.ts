import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CommitteesService } from './committees.service';
import { CreateCommitteeDto } from './dto/create-committee.dto';
import { UpdateCommitteeDto } from './dto/update-committee.dto';
import { UserCommitteeSeasonService } from './user-committee-season.service';
import { CommitteePipe } from './pipes/committee.pipe';
import { UserPipe } from 'src/users/pipes/user.pipe';
import { Committee } from './entities/committee.entity';
import { User } from 'src/users/entities/user.entity';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from 'src/auth/enums/role.enum';
import { CommitteeFunction } from './enums/committee-function.enum';

@Controller('committees')
export class CommitteesController {
  constructor(
    private readonly committeesService: CommitteesService,
    private readonly userCommitteeSeasonsService: UserCommitteeSeasonService,
  ) {}

  @Roles(Role.Admin)
  @Post()
  create(@Body() createCommitteeDto: CreateCommitteeDto) {
    return this.committeesService.create(createCommitteeDto);
  }

  @Get()
  findAll() {
    return this.committeesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.committeesService.findOne(+id);
  }

  @Roles(Role.Admin)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCommitteeDto: UpdateCommitteeDto,
  ) {
    return this.committeesService.update(+id, updateCommitteeDto);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.committeesService.remove(+id);
  }

  @Roles(Role.Admin)
  @Post('user/:committeeId/:userId')
  addUserToCommittee(
    @Param('committeeId', CommitteePipe) committee: Committee,
    @Param('userId', UserPipe) user: User,
  ) {
    return this.userCommitteeSeasonsService.addUserToCommittee(user, committee);
  }

  @Roles(Role.Admin)
  @Patch('user/:committeeId/:userId')
  async updateUserToCommittee(
    @Param('committeeId', CommitteePipe) team: Committee,
    @Param('userId', UserPipe) user: User,
    @Body('function') func: CommitteeFunction,
  ) {
    return this.userCommitteeSeasonsService.updateUserToCommittee(
      user,
      team,
      func,
    );
  }

  @Roles(Role.Admin)
  @Delete('user/:committeeId/:userId')
  async removeUserToCommittee(
    @Param('committeeId', CommitteePipe) team: Committee,
    @Param('userId', UserPipe) user: User,
  ) {
    return this.userCommitteeSeasonsService.removeUserToCommittee(user, team);
  }
}
