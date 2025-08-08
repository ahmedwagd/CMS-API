import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender } from 'generated/prisma';

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[+]?[0-9\s\-()]{10,20}$/, {
    message: 'Phone number must be valid',
  })
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender = Gender.UNSPECIFIED;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9\-_]*$/, {
    message:
      'Social ID must contain only alphanumeric characters, hyphens, and underscores',
  })
  socialId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  specialization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[A-Za-z0-9\-_]*$/, {
    message:
      'License number must contain only alphanumeric characters, hyphens, and underscores',
  })
  licenseNumber?: string;

  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @IsNotEmpty()
  @IsUUID()
  userId?: string;
}
