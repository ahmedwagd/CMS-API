import { IsNotEmpty, IsUUID } from 'class-validator';

export class LinkDoctorToUserDto {
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
