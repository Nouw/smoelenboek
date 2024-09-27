import { Controller, Get, Param, Delete } from '@nestjs/common';
import { NevoboService } from './nevobo.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('nevobo')
export class NevoboController {
  constructor(private readonly nevoboService: NevoboService) {}

  @Public()
  @Get('teams')
  teams() {
    return this.nevoboService.teams();
  }

  @Public()
  @Get('matches/:team')
  matches(@Param('team') team: string) {
    return this.nevoboService.matches(team);
  }

  @Public()
  @Get(`team/:id`)
  team(@Param('id') id: string) {
    return this.nevoboService.team(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nevoboService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nevoboService.remove(+id);
  }

  @Get('match/result/:id')
  getMatchResult(@Param('id') id: string): any {
    return this.nevoboService.getMatchResult(id);
  }
}
