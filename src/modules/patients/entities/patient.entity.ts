import { Gender } from 'generated/prisma';

export class Patient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthDate?: Date;
  gender: Gender;
  occupation?: string;
  weight?: number;
  height?: number;
  medicalHistory?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  wallet?: {
    id: string;
    balance: number;
    currency: string;
    transactions?: any[];
  };

  appointments?: any[];
  examinations?: any[];
  treatmentPlans?: any[];
  progressionNotes?: any[];
}
