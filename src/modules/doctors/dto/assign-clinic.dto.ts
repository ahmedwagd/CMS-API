import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignClinicDto {
  @IsUUID()
  @IsNotEmpty()
  clinicId: string;
}
