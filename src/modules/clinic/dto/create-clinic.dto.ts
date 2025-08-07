import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MaxLength,
  MinLength,
  IsPhoneNumber,
} from 'class-validator';

export class CreateClinicDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  manager: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @IsOptional()
  isActive?: boolean = true;
}
