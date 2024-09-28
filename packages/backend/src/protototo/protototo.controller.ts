import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  StreamableFile,
  Request,
} from '@nestjs/common';
import { Request as ReqType } from '../auth/types/request';
import { ProtototoService } from './protototo.service';
import { CreateProtototoSeasonDto } from './dto/create-protototo-season.dto';
import { Roles } from '../auth/decorators/roles.decorators';
import { Role } from '../auth/enums/role.enum';
import { DatePipe } from '../season/pipes/date.pipe';
import { CreateProtototoMatchDto } from './dto/create-protototo-match.dto';
import { UpdateProtototoSeasonDto } from './dto/update-protototo-season.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { ProtototoPredictionDto } from './dto/protototo-prediction.dto';

@Controller('protototo')
export class ProtototoController {
  constructor(private readonly protototoService: ProtototoService) {}

  @Roles(Role.Admin)
  @Post('season')
  create(@Body() createSeasonDto: CreateProtototoSeasonDto) {
    return this.protototoService.createSeason(createSeasonDto);
  }

  @Roles(Role.Admin)
  @Get('season/overlap/:date')
  overlap(@Param('date', DatePipe) date: Date, @Query('id') id?: string) {
    return this.protototoService.overlap(date, id);
  }

  @Roles(Role.Admin)
  @Get('season')
  findAllSeasons() {
    return this.protototoService.findAllSeasons();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.protototoService.findOne(+id);
  }

  @Get('season/:id/matches')
  findMatches(@Param('id') id: string) {
    return this.protototoService.getMatches(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProtototoDto: UpdateProtototoSeasonDto,
  ) {
    return this.protototoService.update(+id, updateProtototoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.protototoService.remove(+id);
  }

  @Post('season/match')
  addMatch(@Body() createMatchDto: CreateProtototoMatchDto) {
    return this.protototoService.createMatch(createMatchDto);
  }

  @Delete('season/match/:id')
  removeMatch(@Param('id') id: string) {
    return this.protototoService.deleteMatch(+id);
  }

  @Post('match/:id/result')
  fetchMatchResult(@Param('id') id: string) {
    return this.protototoService.fetchMatchResult(+id);
  }

  @Get('season/:id/participants')
  async getParticipants(@Param('id') id: string) {
    const file = await this.protototoService.getParticipants(+id);

    return new StreamableFile(file, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="participants.xlsx"',
    });
  }

  @Public()
  @Get('season/current')
  getCurrentSeason(@Request() request: ReqType) {
    return this.protototoService.getCurrentSeason(request.user);
  }

  @Public()
  @Post('bet/:id')
  saveBet(
    @Param('id') id: string,
    @Body() body: ProtototoPredictionDto,
    @Request() request: ReqType,
  ) {
    return this.protototoService.saveBet(+id, body, request.user);
  }
}
