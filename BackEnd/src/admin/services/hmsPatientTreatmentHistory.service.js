import moment from 'moment';
import HmsAppointment from '../../models/hmsAppointment.model.js';
import HmsStructuredPrescription from '../../models/hmsStructuredPrescription.model.js';
import { assertStaffCanAccessPatient } from '../../utils/staffPatientScope.util.js';
import { formatHmsAppointment } from '../../utils/formatHmsAppointment.js';
import { listAdmissionsByPatient } from './hmsIpd.service.js';

const formatDisplayDate = (value) => {
  if (!value) return '';
  const m = moment(value);
  return m.isValid() ? m.format('D MMM YYYY') : '';
};

const ipdDayLabel = (admittedAt, noteDate) => {
  const start = moment(admittedAt).startOf('day');
  const note = moment(noteDate).startOf('day');
  if (!start.isValid() || !note.isValid()) return 'Day 1';
  return `Day ${Math.max(1, note.diff(start, 'days') + 1)}`;
};

export const getPatientTreatmentHistory = async (patientCode, req) => {
  await assertStaffCanAccessPatient(req, patientCode);

  const apptFilter = { patientCode, status: 'Completed' };
  if (req?.accountType === 'staff' && req.staff?.role === 'Doctor') {
    apptFilter.staffCode = req.staff.staffCode;
  }

  const [appointmentRows, prescriptionRows, ipdAdmissions] = await Promise.all([
    HmsAppointment.find(apptFilter).sort({ appointmentDate: -1, timeSlot: -1 }),
    HmsStructuredPrescription.find({ patientCode }).sort({ createdAt: -1 }),
    listAdmissionsByPatient(patientCode),
  ]);

  const rxByAppointment = new Map();
  for (const rx of prescriptionRows) {
    const code = rx.appointmentCode?.trim();
    if (!code || rxByAppointment.has(code)) continue;
    rxByAppointment.set(code, rx);
  }

  const opd = appointmentRows.map((row) => {
    const appt = formatHmsAppointment(row);
    const rx = rxByAppointment.get(appt.appointmentCode);
    const visitNotes = row.visitNotes?.trim() || '';
    const rxRemarks = rx?.remarks?.trim() || '';

    return {
      appointmentCode: appt.appointmentCode,
      date: appt.dateDisplay,
      dateIso: appt.date,
      title: appt.appointmentType || 'OPD Consultation',
      doctor: appt.doctorName,
      diagnosis: rx?.diagnosis?.trim() || '',
      remarks: rxRemarks || visitNotes || row.followUpNotes?.trim() || '',
    };
  });

  const ipd = ipdAdmissions.map((adm) => {
    const notes = [...(adm.caseNotes ?? [])].sort(
      (a, b) => new Date(a.noteDate).getTime() - new Date(b.noteDate).getTime()
    );

    return {
      admissionCode: adm.admissionCode,
      admittedAt: adm.admittedAt,
      admittedAtLabel: formatDisplayDate(adm.admittedAt),
      dischargedAt: adm.dischargedAt,
      dischargedAtLabel: formatDisplayDate(adm.dischargedAt),
      status: adm.status,
      doctorName: adm.doctorName,
      roomName: adm.roomName,
      roomNumber: adm.roomNumber,
      diagnosis: adm.diagnosis?.trim() || adm.dischargeSummary?.diagnosis?.trim() || '',
      chiefComplaint: adm.chiefComplaint?.trim() || '',
      dailyRecords: notes.map((note) => ({
        id: note.id,
        dayLabel: ipdDayLabel(adm.admittedAt, note.noteDate),
        date: formatDisplayDate(note.noteDate),
        treatmentGiven: note.treatmentGiven?.trim() || '',
        medicines: note.medicines?.trim() || '',
        observations: note.observations?.trim() || '',
        bp: note.bp?.trim() || '',
        pulse: note.pulse?.trim() || '',
        spo2: note.spo2?.trim() || '',
        recordedByName: note.recordedBy?.name?.trim() || '',
      })),
    };
  });

  return { opd, ipd };
};
