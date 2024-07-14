import { CategoryType } from '../enums/catagory-type.enum';

export class CreateCategoryDto {
  name: string;
  type: CategoryType;
  key?: number;
}
