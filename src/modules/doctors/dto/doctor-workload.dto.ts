import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class DoctorWorkloadDto {
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2030)
  year: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
