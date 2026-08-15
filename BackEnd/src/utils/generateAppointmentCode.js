import HmsAppointment from '../models/hmsAppointment.model.js';

export const generateAppointmentCode = async () => {
  const last = await HmsAppointment.findOne({ appointmentCode: { $regex: /^APT-\d{3}$/ } })
    .sort({ appointmentCode: -1 })
    .select('appointmentCode')
    .lean();

  let seq = 1;
  if (last?.appointmentCode) {
    const match = last.appointmentCode.match(/^APT-(\d{3})$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }

  return `APT-${String(seq).padStart(3, '0')}`;
};
