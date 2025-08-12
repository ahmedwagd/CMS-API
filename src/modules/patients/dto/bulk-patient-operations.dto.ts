import { IsArray, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class BulkActivateDeactivateDto {
  @IsArray()
  @IsUUID('all', { each: true })
  patientIds: string[];

  @IsBoolean()
  isActive: boolean;
}

export class BulkDeleteDto {
  @IsArray()
  @IsUUID('all', { each: true })
  patientIds: string[];

  @IsOptional()
  @IsBoolean()
  forceDelete?: boolean = false;
}
