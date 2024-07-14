import { Type } from 'class-transformer';

export class CreateSeasonDto {
  @Type(() => Date)
  startDate: Date;
  @Type(() => Date)
  endDate: Date;
}
