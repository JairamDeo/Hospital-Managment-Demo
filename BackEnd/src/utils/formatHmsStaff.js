const statLabelForRole = (role) => {
  if (role === 'Support') return 'Handled';
  return 'Patients';
};

export const formatHmsStaff = (doc) => {
  const s = doc.toObject ? doc.toObject() : { ...doc };

  return {
    _id: String(s._id),
    staffCode: s.staffCode,
    id: s.staffCode,
    name: s.name,
    role: s.role,
    title: s.title || '',
    dutyStatus: s.dutyStatus,
    status: s.dutyStatus,
    statPrimaryValue: s.statPrimaryValue ?? 0,
    statPrimaryLabel: s.statPrimaryLabel || statLabelForRole(s.role),
    todayCount: s.todayCount ?? 0,
    todayLabel: s.todayLabel || 'Today',
    rating: s.rating ?? 5,
    tags: Array.isArray(s.tags) ? s.tags : [],
    shift: s.shift || '9AM – 5PM',
    consultationFee: Number(s.consultationFee) || 0,
    qualifications: Array.isArray(s.qualifications) ? s.qualifications : [],
    registrationNumber: s.registrationNumber || '',
    aadharNumber: s.aadharNumber || '',
    panNumber: s.panNumber || '',
    email: s.email || '',
    accountActive: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
};
