import { Exclude, Transform } from 'class-transformer';
import { Gender } from 'generated/prisma';

export class PatientResponseDto {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthDate?: Date;
  gender: Gender;
  occupation?: string;
  weight?: number;
  height?: number;

  @Exclude({ toPlainOnly: true })
  medicalHistory?: string;

  emergencyContact?: string;
  emergencyPhone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Computed field for age
  @Transform(({ obj }) => {
    if (!obj.birthDate) return null;
    const today = new Date();
    const birthDate = new Date(obj.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  })
  age?: number;

  wallet?: {
    id: string;
    balance: number;
    currency: string;
  };

  _count?: {
    appointments: number;
    examinations: number;
    treatmentPlans: number;
    progressionNotes: number;
  };

  // Include recent appointments and medical records in detailed view
  appointments?: any[];
  examinations?: any[];
  treatmentPlans?: any[];
  progressionNotes?: any[];
}
