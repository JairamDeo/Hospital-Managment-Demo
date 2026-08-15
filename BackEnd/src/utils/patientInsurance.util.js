const POLICY_TYPES = ['Individual', 'Family', 'Group'];
const STATUSES = ['Active', 'Expired', 'Pending', 'Cancelled'];

export const normalizeInsurance = (raw = {}) => {
  const dependents = (raw.dependents ?? [])
    .map((d) => ({
      name: String(d.name ?? '').trim(),
      relation: String(d.relation ?? '').trim(),
      age: Number(d.age) || 0,
    }))
    .filter((d) => d.name);

  const insurance = {
    providerName: String(raw.providerName ?? '').trim(),
    policyNumber: String(raw.policyNumber ?? '').trim(),
    policyType: POLICY_TYPES.includes(raw.policyType) ? raw.policyType : 'Individual',
    sumInsured: Math.max(0, Number(raw.sumInsured) || 0),
    annualPremium: Math.max(0, Number(raw.annualPremium) || 0),
    startDate: raw.startDate ? new Date(raw.startDate) : null,
    endDate: raw.endDate ? new Date(raw.endDate) : null,
    tpaName: String(raw.tpaName ?? '').trim(),
    cardNumber: String(raw.cardNumber ?? '').trim(),
    dependents,
    notes: String(raw.notes ?? '').trim(),
    status: STATUSES.includes(raw.status) ? raw.status : 'Pending',
  };

  if (!insurance.providerName && !insurance.policyNumber) {
    insurance.status = 'Pending';
  } else if (insurance.status === 'Cancelled') {
    // keep
  } else {
    const end = insurance.endDate;
    if (end && !Number.isNaN(end.getTime()) && end < new Date()) {
      insurance.status = 'Expired';
    } else if (insurance.status !== 'Cancelled') {
      insurance.status = 'Active';
    }
  }

  return insurance;
};

export const formatInsuranceForApi = (insurance) => {
  const row = normalizeInsurance(insurance);
  return {
    providerName: row.providerName,
    policyNumber: row.policyNumber,
    policyType: row.policyType,
    sumInsured: row.sumInsured,
    annualPremium: row.annualPremium,
    startDate: row.startDate ? row.startDate.toISOString() : null,
    endDate: row.endDate ? row.endDate.toISOString() : null,
    tpaName: row.tpaName,
    cardNumber: row.cardNumber,
    dependents: row.dependents,
    notes: row.notes,
    status: row.status,
    isEnrolled: Boolean(row.providerName && row.policyNumber),
  };
};

export const formatPatientInsuranceRow = (doc) => {
  const p = doc.toObject ? doc.toObject() : { ...doc };
  const ins = formatInsuranceForApi(p.healthInsurance ?? {});
  return {
    patientCode: p.patientCode,
    name: p.name,
    age: p.age ?? null,
    gender: p.gender ?? 'Not recorded',
    mobileNumber: p.mobileNumber ?? '',
    recordStatus: p.recordStatus ?? 'Active',
    insurance: ins,
  };
};

export const getInsuranceStats = (rows) => {
  const enrolled = rows.filter((r) => r.insurance.isEnrolled).length;
  const active = rows.filter((r) => r.insurance.status === 'Active').length;
  const expiringSoon = rows.filter((r) => {
    if (!r.insurance.endDate || r.insurance.status !== 'Active') return false;
    const end = new Date(r.insurance.endDate);
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    return end <= in30;
  }).length;
  const notEnrolled = rows.length - enrolled;
  return { total: rows.length, enrolled, active, expiringSoon, notEnrolled };
};
