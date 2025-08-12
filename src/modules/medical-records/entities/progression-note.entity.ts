export class ProgressionNote {
  id: string;
  patientId: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  patient?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
}
