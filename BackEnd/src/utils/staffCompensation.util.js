export const emptyCompensation = () => ({
  basicSalary: 0,
  hra: 0,
  dearnessAllowance: 0,
  specialAllowance: 0,
  transportAllowance: 0,
  medicalAllowance: 0,
  otherAllowances: 0,
  pfDeduction: 0,
  professionalTax: 0,
  otherDeductions: 0,
});

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export const normalizeCompensation = (raw, legacyBasicSalary = 0) => {
  const base = emptyCompensation();
  if (!raw || typeof raw !== 'object') {
    if (legacyBasicSalary > 0) base.basicSalary = legacyBasicSalary;
    return base;
  }
  return {
    basicSalary: num(raw.basicSalary ?? legacyBasicSalary),
    hra: num(raw.hra),
    dearnessAllowance: num(raw.dearnessAllowance),
    specialAllowance: num(raw.specialAllowance),
    transportAllowance: num(raw.transportAllowance),
    medicalAllowance: num(raw.medicalAllowance),
    otherAllowances: num(raw.otherAllowances),
    pfDeduction: num(raw.pfDeduction),
    professionalTax: num(raw.professionalTax),
    otherDeductions: num(raw.otherDeductions),
  };
};

export const computeCompensationTotals = (compensation) => {
  const c = normalizeCompensation(compensation);
  const grossMonthly =
    c.basicSalary +
    c.hra +
    c.dearnessAllowance +
    c.specialAllowance +
    c.transportAllowance +
    c.medicalAllowance +
    c.otherAllowances;
  const totalDeductions = c.pfDeduction + c.professionalTax + c.otherDeductions;
  const netMonthly = Math.max(0, grossMonthly - totalDeductions);
  return {
    grossMonthly: Math.round(grossMonthly * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netMonthly: Math.round(netMonthly * 100) / 100,
  };
};

export const attachCompensation = (staffDoc) => {
  const legacyBasic = Number(staffDoc.basicSalary) || 0;
  const compensation = normalizeCompensation(staffDoc.compensation, legacyBasic);
  const totals = computeCompensationTotals(compensation);
  return {
    compensation,
    ...totals,
    consultationFee: Number(staffDoc.consultationFee) || 0,
  };
};
