export type InsurancePolicyType = 'Individual' | 'Family' | 'Group';
export type InsuranceStatus = 'Active' | 'Expired' | 'Pending' | 'Cancelled';

export interface InsuranceDependent {
  name: string;
  relation: string;
  age: number;
}

export interface PatientHealthInsurance {
  providerName: string;
  policyNumber: string;
  policyType: InsurancePolicyType;
  sumInsured: number;
  annualPremium: number;
  startDate: string | null;
  endDate: string | null;
  tpaName: string;
  cardNumber: string;
  dependents: InsuranceDependent[];
  notes: string;
  status: InsuranceStatus;
  isEnrolled: boolean;
}

export interface PatientInsuranceRow {
  patientCode: string;
  name: string;
  age: number | null;
  gender: string;
  mobileNumber: string;
  recordStatus: string;
  insurance: PatientHealthInsurance;
}

export interface PatientInsuranceStats {
  total: number;
  enrolled: number;
  active: number;
  expiringSoon: number;
  notEnrolled: number;
}

export interface InsuranceDependentFormRow {
  name: string;
  relation: string;
  age: string;
}

export interface PatientInsuranceFormValues {
  providerName: string;
  policyNumber: string;
  policyType: InsurancePolicyType;
  sumInsured: string;
  annualPremium: string;
  startDate: string;
  endDate: string;
  tpaName: string;
  cardNumber: string;
  dependents: InsuranceDependentFormRow[];
  notes: string;
  status: InsuranceStatus;
}

export const emptyDependentRow = (): InsuranceDependentFormRow => ({
  name: '',
  relation: '',
  age: '',
});

export const emptyInsuranceForm = (): PatientInsuranceFormValues => ({
  providerName: '',
  policyNumber: '',
  policyType: 'Individual',
  sumInsured: '',
  annualPremium: '',
  startDate: '',
  endDate: '',
  tpaName: '',
  cardNumber: '',
  dependents: [],
  notes: '',
  status: 'Pending',
});

export const insuranceFormFromRow = (row: PatientInsuranceRow): PatientInsuranceFormValues => {
  const ins = row.insurance;
  return {
    providerName: ins.providerName,
    policyNumber: ins.policyNumber,
    policyType: ins.policyType,
    sumInsured: ins.sumInsured > 0 ? String(ins.sumInsured) : '',
    annualPremium: ins.annualPremium > 0 ? String(ins.annualPremium) : '',
    startDate: ins.startDate ? ins.startDate.slice(0, 10) : '',
    endDate: ins.endDate ? ins.endDate.slice(0, 10) : '',
    tpaName: ins.tpaName,
    cardNumber: ins.cardNumber,
    dependents: (ins.dependents ?? []).map((d) => ({
      name: d.name,
      relation: d.relation,
      age: d.age > 0 ? String(d.age) : '',
    })),
    notes: ins.notes,
    status: ins.status,
  };
};
