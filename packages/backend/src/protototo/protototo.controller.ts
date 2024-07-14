import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProtototoService } from './protototo.service';
import { CreateProtototoDto } from './dto/create-protototo.dto';
import { UpdateProtototoDto } from './dto/update-protototo.dto';

@Controller('protototo')
export class ProtototoController {
  constructor(private readonly protototoService: ProtototoService) {}

  @Post()
  create(@Body() createProtototoDto: CreateProtototoDto) {
    return this.protototoService.create(createProtototoDto);
  }

  @Get()
  findAll() {
    return this.protototoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.protototoService.findOne(+id);
  }

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
}
