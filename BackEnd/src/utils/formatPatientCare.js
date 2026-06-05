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
      vitals: { temp: '—', bp: '—', pulse: '—', bmi: '—' },
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
      bmi: c.vitals?.bmi || '—',
    },
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
