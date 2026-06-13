import moment from 'moment';

const mapWithId = (items, prefix) =>
  (items ?? [])
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((item, index) => {
      const plain = item.toObject ? item.toObject() : { ...item };
      const id = String(plain._id ?? `${prefix}-${index}`);
      if (plain.invoiceCode) {
        return {
          id: plain.invoiceCode,
          date: plain.date,
          treatment: plain.treatment,
          feeType: plain.feeType || '',
          amount: plain.amount,
          status: plain.status,
        };
      }
      return { ...plain, id };
    });

export const formatPatientCare = (care) => {
  if (!care) {
    return {
      vitals: { temp: '—', bp: '—', pulse: '—', spo2: '—', bmi: '—' },
      vitalsHistory: [],
      activeTreatment: null,
      treatmentHistory: [],
      appointments: [],
      labReports: [],
      invoices: [],
      documents: [],
    };
  }

  const c = care.toObject ? care.toObject() : { ...care };
  const active = c.activeTreatment?.program ? c.activeTreatment : null;

  return {
    vitals: {
      temp: c.vitals?.temp || '—',
      bp: c.vitals?.bp || '—',
      pulse: c.vitals?.pulse || '—',
      spo2: c.vitals?.spo2 || '—',
      bmi: c.vitals?.bmi || '—',
    },
    vitalsHistory: (c.vitalsHistory ?? []).map((v, index) => ({
      id: String(v._id ?? `vh-${index}`),
      date: v.date || '',
      bp: v.bp || '',
      pulse: v.pulse || '',
      spo2: v.spo2 || '',
      fasting: v.fasting || '',
      postMeal: v.postMeal || '',
      random: v.random || '',
      weight: v.weight || '',
      recordedByName: v.recordedByName || '',
    })),
    activeTreatment: active,
    treatmentHistory: mapWithId(c.treatmentHistory, 'th'),
    appointments: mapWithId(c.appointments, 'ap'),
    labReports: mapWithId(c.labReports, 'lr'),
    invoices: mapWithId(c.invoices, 'inv'),
    documents: mapWithId(c.documents, 'doc'),
  };
};

export const formatMemberSince = (createdAt) =>
  createdAt ? moment(createdAt).format('MMM YYYY') : '—';

export const formatLastVisit = (date) =>
  date ? moment(date).format('MMM D, YYYY') : '—';
