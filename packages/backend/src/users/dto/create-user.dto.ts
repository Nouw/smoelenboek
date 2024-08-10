import { IsEmail, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsNotEmpty()
  phoneNumber: string;

  @IsNotEmpty()
  bondNumber: string;

  @Type(() => Date)
  birthDate: Date;
}
