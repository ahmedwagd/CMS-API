export class ClinicResponseDto {
  id: string;
  name: string;
  phone: string;
  address: string;
  manager: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations (optional)
  doctors?: Array<{
    id: string;
    name: string;
    specialization?: string;
  }>;

  _count?: {
    doctors: number;
  };
}
