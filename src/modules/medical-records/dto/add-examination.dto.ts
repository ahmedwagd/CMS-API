import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddExaminationDto {
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  subjectivePainScale?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subjectiveLocation?: string;

  @IsOptional()
  @IsString()
  subjectiveDescription?: string;

  @IsOptional()
  @IsString()
  subjectiveAggravatingFactors?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  objectivePosture?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  objectiveRegion?: string;

  @IsOptional()
  @IsString()
  objectivePhysiologicalMotion?: string;

  @IsOptional()
  @IsString()
  palpation?: string;
}
