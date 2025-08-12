import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class AddTreatmentPlanDto {
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
