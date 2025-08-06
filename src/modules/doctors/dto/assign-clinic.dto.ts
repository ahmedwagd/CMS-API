import { IsUUID } from 'class-validator';

export class AssignClinicDto {
  @IsUUID()
  clinicId: string;
}
