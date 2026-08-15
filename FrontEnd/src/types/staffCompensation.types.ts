import type { StaffRole } from './staff.types';

export interface StaffCompensationBreakdown {
  basicSalary: number;
  hra: number;
  dearnessAllowance: number;
  specialAllowance: number;
  transportAllowance: number;
  medicalAllowance: number;
  otherAllowances: number;
  pfDeduction: number;
  professionalTax: number;
  otherDeductions: number;
}

export interface StaffCompensationRow {
  staffCode: string;
  name: string;
  role: StaffRole;
  title: string;
  shift: string;
  consultationFee: number;
  compensation: StaffCompensationBreakdown;
  grossMonthly: number;
  totalDeductions: number;
  netMonthly: number;
}

export interface StaffCompensationFormValues {
  basicSalary: string;
  hra: string;
  dearnessAllowance: string;
  specialAllowance: string;
  transportAllowance: string;
  medicalAllowance: string;
  otherAllowances: string;
  pfDeduction: string;
  professionalTax: string;
  otherDeductions: string;
  consultationFee: string;
}

export const emptyCompensationForm = (): StaffCompensationFormValues => ({
  basicSalary: '',
  hra: '',
  dearnessAllowance: '',
  specialAllowance: '',
  transportAllowance: '',
  medicalAllowance: '',
  otherAllowances: '',
  pfDeduction: '',
  professionalTax: '',
  otherDeductions: '',
  consultationFee: '',
});
