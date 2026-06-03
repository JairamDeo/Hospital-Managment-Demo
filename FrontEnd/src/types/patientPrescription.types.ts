export interface PatientPrescriptionPdf {
  _id: string;
  id: string;
  patientCode: string;
  title: string;
  fileName: string;
  mimeType: string;
  bytes: number;
  sizeLabel: string;
  url: string;
  cloudinaryPublicId: string;
  cloudinaryFolder: string;
  uploadedAt: string;
  createdAt?: string;
}
