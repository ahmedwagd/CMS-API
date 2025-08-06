import { Gender } from 'generated/prisma';

export class DoctorResponseDto {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gender: Gender;
  socialId?: string;
  specialization?: string;
  licenseNumber?: string;
  clinicId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  clinic?: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };

  _count?: {
    appointments: number;
    examinations: number;
    treatmentPlans: number;
  };
}
