import moment from 'moment';

export const formatHmsPatient = (doc) => {
  const p = doc.toObject ? doc.toObject() : { ...doc };
  delete p.otp;
  delete p.otpExpiresAt;
  delete p.lastOtpSentAt;

  const prakritiDoc = p.prakriti && typeof p.prakriti === 'object' ? p.prakriti : null;
  const treatmentDoc = p.treatment && typeof p.treatment === 'object' ? p.treatment : null;

  return {
    _id: String(p._id),
    patientCode: p.patientCode,
    id: p.patientCode,
    name: p.name,
    email: p.email || '',
    mobileNumber: p.mobileNumber,
    mobile: p.mobileNumber,
    age: p.age,
    gender: p.gender,
    prakritiId: prakritiDoc ? String(prakritiDoc._id) : p.prakriti ? String(p.prakriti) : null,
    prakritiName: prakritiDoc?.name ?? null,
    prakriti: prakritiDoc?.name ?? null,
    treatmentId: treatmentDoc ? String(treatmentDoc._id) : p.treatment ? String(p.treatment) : null,
    treatmentName: treatmentDoc?.name ?? null,
    treatment: treatmentDoc?.name ?? null,
    lastVisit: p.lastVisit ? moment(p.lastVisit).format('MMM D, YYYY') : '',
    lastVisitRaw: p.lastVisit,
    bloodGroup: p.bloodGroup || '—',
    city: p.city || 'India',
    memberSince: p.createdAt ? moment(p.createdAt).format('MMM YYYY') : '—',
    recordStatus: p.recordStatus,
    status: p.recordStatus,
    createdByAdmin: p.createdByAdmin,
    accountActive: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
};
