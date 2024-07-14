import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  streetName: string;

  @IsNotEmpty()
  houseNumber: string;

  @IsNotEmpty()
  postcode: string;

  @IsNotEmpty()
  city: string;

  @IsNotEmpty()
  bankaccountNumber: string;
}
