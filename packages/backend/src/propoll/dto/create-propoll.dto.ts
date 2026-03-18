import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePropollDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;

  @IsBoolean()
  allowMultiple: boolean;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(200, { each: true })
  options: string[];

  @Type(() => Date)
  @IsDate()
  voteStartAt: Date;

  @Type(() => Date)
  @IsDate()
  voteEndAt: Date;
}
