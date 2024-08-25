import { Type } from 'class-transformer';

export class CreateProtototoSeasonDto {
  @Type(() => Date)
  start: Date;
  @Type(() => Date)
  end: Date;

  tikkie?: string;
}
