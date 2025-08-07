import { Gender } from 'generated/prisma';

export class Doctor {
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

  // Relations
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

  appointments?: Array<{
    id: string;
    date: Date;
    time: Date;
    status: string;
    duration?: number;
    notes?: string;
    patient?: {
      id: string;
      name: string;
      phone: string;
      email?: string;
      gender: Gender;
      socialId?: string;
      age?: number;
    };
  }>;
}
