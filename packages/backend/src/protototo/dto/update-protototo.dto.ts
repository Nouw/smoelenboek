import { PartialType } from '@nestjs/mapped-types';
import { CreateProtototoDto } from './create-protototo.dto';

export class UpdateProtototoDto extends PartialType(CreateProtototoDto) {}
