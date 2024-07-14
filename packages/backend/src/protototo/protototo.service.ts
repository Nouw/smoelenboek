import { Injectable } from '@nestjs/common';
import { CreateProtototoDto } from './dto/create-protototo.dto';
import { UpdateProtototoDto } from './dto/update-protototo.dto';

@Injectable()
export class ProtototoService {
  create(createProtototoDto: CreateProtototoDto) {
    return 'This action adds a new protototo';
  }

  findAll() {
    return `This action returns all protototo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} protototo`;
  }

  update(id: number, updateProtototoDto: UpdateProtototoDto) {
    return `This action updates a #${id} protototo`;
  }

  remove(id: number) {
    return `This action removes a #${id} protototo`;
  }
}
