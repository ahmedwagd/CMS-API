import { IsDateString, IsNotEmpty } from 'class-validator';

export class DoctorScheduleDto {
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
