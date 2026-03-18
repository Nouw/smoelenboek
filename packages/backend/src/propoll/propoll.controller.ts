import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { PropollService } from './propoll.service';
import { CreatePropollDto } from './dto/create-propoll.dto';
import { UpdatePropollDto } from './dto/update-propoll.dto';
import { Request as RequestType } from '../auth/types/request';
import { VotePropollDto } from './dto/vote-propoll.dto';
import { Roles } from '../auth/decorators/roles.decorators';
import { Role } from '../auth/enums/role.enum';

@Controller('propoll')
export class PropollController {
  constructor(private readonly propollService: PropollService) {}

  @Roles(Role.Admin)
  @Post()
  create(
    @Body() createPropollDto: CreatePropollDto,
    @Request() request: RequestType,
  ) {
    return this.propollService.create(createPropollDto, request.user?.id);
  }

  @Get()
  findAll(@Request() request: RequestType) {
    return this.propollService.findAll(request.user?.id);
  }

  @Get('active')
  findActive(@Request() request: RequestType) {
    return this.propollService.findActive(request.user?.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() request: RequestType) {
    return this.propollService.findOne(+id, request.user?.id);
  }

  @Post(':id/vote')
  vote(
    @Param('id') id: string,
    @Body() votePropollDto: VotePropollDto,
    @Request() request: RequestType,
  ) {
    return this.propollService.vote(+id, votePropollDto, request.user?.id);
  }

  @Roles(Role.Admin)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePropollDto: UpdatePropollDto,
    @Request() request: RequestType,
  ) {
    return this.propollService.update(+id, updatePropollDto, request.user?.id);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propollService.remove(+id);
  }
}
