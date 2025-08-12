import {
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TimelineEventType {
  EXAMINATION = 'examination',
  TREATMENT_PLAN = 'treatment_plan',
  PROGRESSION_NOTE = 'progression_note',
  APPOINTMENT = 'appointment',
  ALL = 'all',
}

export class PatientMedicalTimelineDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TimelineEventType)
  eventType?: TimelineEventType = TimelineEventType.ALL;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
