import { PartialType } from '@nestjs/mapped-types';
import { AddTreatmentPlanDto } from './add-treatment-plan.dto';

export class UpdateTreatmentPlanDto extends PartialType(AddTreatmentPlanDto) {}

// src/modules/medical-records/dto/add-progression-note.dto.ts
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AddProgressionNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  note: string;
}
