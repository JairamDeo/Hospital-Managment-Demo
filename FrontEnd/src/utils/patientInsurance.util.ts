import type { PatientInsuranceFormValues } from '@/types/patientInsurance.types';

const normalizeDependents = (values: PatientInsuranceFormValues) =>
  values.dependents
    .filter((d) => d.name.trim())
    .map((d) => ({
      name: d.name.trim(),
      relation: d.relation.trim(),
      age: Number(d.age) || 0,
    }));

export const formToInsurancePayload = (values: PatientInsuranceFormValues) => ({
  insurance: {
    providerName: values.providerName.trim(),
    policyNumber: values.policyNumber.trim(),
    policyType: values.policyType,
    sumInsured: Number(values.sumInsured) || 0,
    annualPremium: Number(values.annualPremium) || 0,
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    tpaName: values.tpaName.trim(),
    cardNumber: values.cardNumber.trim(),
    dependents: normalizeDependents(values),
    notes: values.notes.trim(),
    status: values.status,
  },
});

export const formatInsuranceDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { dateStyle: 'medium' });
};

export const formatSumInsured = (amount: number) => {
  if (!amount) return '—';
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const insuranceStatusClass = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-success-bg text-success';
    case 'Expired':
      return 'bg-danger-bg text-danger';
    case 'Cancelled':
      return 'bg-sage-mist text-ink-soft';
    default:
      return 'bg-warning-bg text-warning';
  }
};
