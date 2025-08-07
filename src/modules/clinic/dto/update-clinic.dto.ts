import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateClinicDto } from './create-clinic.dto';

export class UpdateClinicDto extends PartialType(CreateClinicDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
