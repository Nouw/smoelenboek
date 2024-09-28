import { PartialType } from '@nestjs/mapped-types';
import { CreateProtototoSeasonDto } from './create-protototo-season.dto';

export class UpdateProtototoSeasonDto extends PartialType(
  CreateProtototoSeasonDto,
) {}
