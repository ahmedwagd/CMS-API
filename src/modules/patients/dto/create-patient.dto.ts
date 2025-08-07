import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDateString,
  IsDecimal,
  IsPhoneNumber,
  MaxLength,
  MinLength,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender } from 'generated/prisma';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[+]?[0-9\s\-()]{10,20}$/, {
    message: 'Phone number must be valid',
  })
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender = Gender.UNSPECIFIED;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  occupation?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(1000)
  weight?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(300)
  height?: number;

  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[+]?[0-9\s\-()]{10,20}$/, {
    message: 'Emergency phone number must be valid',
  })
  emergencyPhone?: string;
}
