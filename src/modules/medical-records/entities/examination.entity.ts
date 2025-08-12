export class Examination {
  id: string;
  patientId: string;
  doctorId: string;
  subjectivePainScale?: number;
  subjectiveLocation?: string;
  subjectiveDescription?: string;
  subjectiveAggravatingFactors?: string;
  objectivePosture?: string;
  objectiveRegion?: string;
  objectivePhysiologicalMotion?: string;
  palpation?: string;
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
