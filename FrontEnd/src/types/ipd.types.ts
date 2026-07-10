export type IpdAdmissionStatus = 'Admitted' | 'Discharged';

export type IpdRoomStatus = 'Available' | 'Partial' | 'Full';

export interface IpdRoom {
  id: string;
  roomCode: string;
  roomNumber: string;
  name: string;
  capacity: number;
  occupied: number;
  available: number;
  status: IpdRoomStatus;
}

export interface IpdCaseNote {
  id: string;
  noteDate: string;
  treatmentGiven: string;
  medicines: string;
  observations: string;
  bp: string;
  pulse: string;
  spo2: string;
  recordedBy?: { type: string; staffCode: string; name: string } | null;
}

export interface IpdDischargeSummary {
  diagnosis: string;
  treatmentSummary: string;
  medicinesAtDischarge: string;
  advice: string;
  followUpDate?: string | null;
  dischargedBy?: { type: string; staffCode: string; name: string } | null;
}

export interface IpdAdmission {
  _id: string;
  admissionCode: string;
  id: string;
  patientCode: string;
  patientId: string;
  patientName: string;
  initials: string;
  avatarClass: string;
  roomCode: string;
  roomName: string;
  roomNumber: string;
  staffCode: string;
  doctorName: string;
  admittedAt: string;
  expectedDischargeAt?: string | null;
  status: IpdAdmissionStatus;
  dischargedAt?: string | null;
  diagnosis: string;
  chiefComplaint: string;
  caseNotes: IpdCaseNote[];
  dischargeSummary?: IpdDischargeSummary | null;
}

export interface IpdStats {
  admittedCount: number;
  totalCapacity: number;
  totalOccupied: number;
  availableBeds: number;
  rooms: IpdRoom[];
}

export interface AdmitPatientFormValues {
  patientId: string;
  roomCode: string;
  doctorId: string;
  admittedAt: string;
  expectedDischargeAt: string;
  diagnosis: string;
  chiefComplaint: string;
}

export interface DischargeFormValues {
  diagnosis: string;
  treatmentSummary: string;
  medicinesAtDischarge: string;
  advice: string;
  followUpDate: string;
}

export interface CaseNoteFormValues {
  treatmentGiven: string;
  medicines: string;
  observations: string;
  bpSystolic: string;
  bpDiastolic: string;
  pulse: string;
  spo2: string;
}
