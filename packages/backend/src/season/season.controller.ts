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
import { SeasonService } from './season.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from 'src/auth/enums/role.enum';
import { DatePipe } from './pipes/date.pipe';

@Controller('season')
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) { }

  @Roles(Role.Admin)
  @Post()
  create(@Body() createSeasonDto: CreateSeasonDto) {
    return this.seasonService.create(createSeasonDto);
  }

  @Roles(Role.Admin)
  @Get()
  findAll() {
    return this.seasonService.findAll();
  }

  @Roles(Role.Admin)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seasonService.findOne(+id);
  }

  @Roles(Role.Admin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSeasonDto: UpdateSeasonDto) {
    return this.seasonService.update(+id, updateSeasonDto);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.seasonService.remove(+id);
  }

  @Roles(Role.Admin)
  @Get('overlap/:date')
  overlap(@Param('date', DatePipe) date: Date, @Query('id') id?: string) {
    return this.seasonService.overlap(date, id);
  }
}
