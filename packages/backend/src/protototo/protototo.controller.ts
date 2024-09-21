import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProtototoService } from './protototo.service';
import { UpdateProtototoDto } from './dto/update-protototo.dto';
import { CreateProtototoSeasonDto } from './dto/create-protototo-season.dto';
import { Roles } from '../auth/decorators/roles.decorators';
import { Role } from '../auth/enums/role.enum';
import { DatePipe } from '../season/pipes/date.pipe';
import { CreateProtototoMatchDto } from './dto/create-protototo-match.dto';

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
  findMatches(@Param('id') id: string) {}

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProtototoDto: UpdateProtototoDto,
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
}
