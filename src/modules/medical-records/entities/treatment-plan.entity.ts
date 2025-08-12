export class TreatmentPlan {
  id: string;
  patientId: string;
  doctorId: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  patient?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };

  doctor?: {
    id: string;
    name: string;
    specialization?: string;
    phone?: string;
  };
}
