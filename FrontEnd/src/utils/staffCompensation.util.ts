import type {
  StaffCompensationBreakdown,
  StaffCompensationFormValues,
  StaffCompensationRow,
} from '@/types/staffCompensation.types';

const num = (v: string | number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export const computeCompensationTotals = (comp: StaffCompensationBreakdown) => {
  const grossMonthly =
    comp.basicSalary +
    comp.hra +
    comp.dearnessAllowance +
    comp.specialAllowance +
    comp.transportAllowance +
    comp.medicalAllowance +
    comp.otherAllowances;
  const totalDeductions = comp.pfDeduction + comp.professionalTax + comp.otherDeductions;
  const netMonthly = Math.max(0, grossMonthly - totalDeductions);
  return {
    grossMonthly: Math.round(grossMonthly * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netMonthly: Math.round(netMonthly * 100) / 100,
  };
};

export const rowToCompensationForm = (row: StaffCompensationRow): StaffCompensationFormValues => {
  const c = row.compensation;
  const str = (n: number) => (n > 0 ? String(n) : '');
  return {
    basicSalary: str(c.basicSalary),
    hra: str(c.hra),
    dearnessAllowance: str(c.dearnessAllowance),
    specialAllowance: str(c.specialAllowance),
    transportAllowance: str(c.transportAllowance),
    medicalAllowance: str(c.medicalAllowance),
    otherAllowances: str(c.otherAllowances),
    pfDeduction: str(c.pfDeduction),
    professionalTax: str(c.professionalTax),
    otherDeductions: str(c.otherDeductions),
    consultationFee: row.role === 'Doctor' && row.consultationFee > 0 ? String(row.consultationFee) : '',
  };
};

export const formToCompensationPayload = (values: StaffCompensationFormValues) => ({
  compensation: {
    basicSalary: num(values.basicSalary),
    hra: num(values.hra),
    dearnessAllowance: num(values.dearnessAllowance),
    specialAllowance: num(values.specialAllowance),
    transportAllowance: num(values.transportAllowance),
    medicalAllowance: num(values.medicalAllowance),
    otherAllowances: num(values.otherAllowances),
    pfDeduction: num(values.pfDeduction),
    professionalTax: num(values.professionalTax),
    otherDeductions: num(values.otherDeductions),
  },
  consultationFee: values.consultationFee.trim() ? num(values.consultationFee) : 0,
});

export const formTotalsPreview = (values: StaffCompensationFormValues) => {
  const { compensation } = formToCompensationPayload(values);
  return computeCompensationTotals(compensation);
};

export const formatPay = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
