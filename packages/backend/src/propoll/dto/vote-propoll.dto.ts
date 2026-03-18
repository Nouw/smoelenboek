import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class VotePropollDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  optionIds: number[];
}
