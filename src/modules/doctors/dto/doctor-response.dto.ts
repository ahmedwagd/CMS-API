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
    manager: string;
    email: string;
    _count?: {
      doctors: number;
    };
  };

  user?: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    lastLoginAt?: Date;
  };

  _count?: {
    appointments: number;
    examinations: number;
    treatmentPlans: number;
  };

  // Include recent appointments and medical records in detailed view
  appointments?: Array<{
    id: string;
    date: Date;
    time: Date;
    status: string;
    notes?: string;
    patient: {
      id: string;
      name: string;
      phone?: string;
      email?: string;
      birthDate?: Date;
      gender: Gender;
    };
    invoice?: {
      id: string;
      amount: number;
      status: string;
      dueDate?: Date;
    };
  }>;

  examinations?: Array<{
    id: string;
    subjectivePainScale?: number;
    subjectiveLocation?: string;
    createdAt: Date;
    patient: {
      id: string;
      name: string;
      birthDate?: Date;
      gender: Gender;
    };
  }>;

  treatmentPlans?: Array<{
    id: string;
    description: string;
    createdAt: Date;
    patient: {
      id: string;
      name: string;
      birthDate?: Date;
      gender: Gender;
    };
  }>;
}
