import type { HmsAppointment } from '@/types/api.types';
import type { Appointment, AppointmentFormValues, AppointmentType, CalendarDotType } from '@/types/appointment.types';
import type { AppointmentDetail } from '@/types/appointmentDetail.types';
import type { Patient } from '@/types/patient.types';
import { getInitials, pickAvatarClass } from '@/utils/staffHelpers';
import type { StaffAssignment } from '@/pages/staff/data/mockStaffDetails';

export const emptyAppointmentForm = (): AppointmentFormValues => ({
  patientId: '',
  staffCode: '',
  type: 'General Consult',
  date: new Date().toISOString().slice(0, 10),
  time: '10:30',
  notes: '',
});

export const hmsToAppointment = (a: HmsAppointment): Appointment => ({
  id: a.appointmentCode ?? a.id,
  patientId: a.patientCode ?? a.patientId,
  patientName: a.patientName,
  initials: a.initials ?? getInitials(a.patientName),
  avatarClass: a.avatarClass ?? pickAvatarClass(a.patientName),
  staffCode: a.staffCode,
  doctorName: a.doctorName ?? a.doctor ?? '',
  type: (a.appointmentType ?? a.type) as AppointmentType,
  date: (a.date ?? '').slice(0, 10),
  time: a.timeSlot ?? a.time,
  status: (a.adminStatus ?? 'Soon') as Appointment['status'],
  notes: a.notes,
  createdAt: a.createdAt,
});

export const appointmentsToStaffAssignments = (
  appointments: HmsAppointment[]
): StaffAssignment[] =>
  appointments.map((a) => ({
    id: a.appointmentCode ?? a.id,
    patientName: a.patientName,
    patientId: a.patientCode ?? a.patientId,
    program: `${a.appointmentType ?? a.type} · ${a.dateDisplay ?? a.date}`,
    since: a.timeDisplay ?? a.time,
    status: a.status === 'Completed' ? 'Completed' : 'Active',
  }));

export const formatTimeLabel = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

export const formatDateLabel = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const durationForType = (type: AppointmentType): string => {
  switch (type) {
    case 'Panchakarma':
    case 'Shodhana':
      return '90 min';
    case 'Diet Consult':
      return '45 min';
    case 'Follow-up':
      return '20 min';
    default:
      return '30 min';
  }
};

const departmentForType = (type: AppointmentType): string => {
  switch (type) {
    case 'Panchakarma':
    case 'Shodhana':
      return 'Panchakarma Wing';
    case 'Diet Consult':
      return 'Nutrition & Dietetics';
    default:
      return 'OPD — Ayurveda';
  }
};

export const buildAppointmentDetail = (appt: Appointment, patient?: Patient): AppointmentDetail => ({
  ...appt,
  formattedDate: formatDateLabel(appt.date),
  formattedTime: formatTimeLabel(appt.time),
  duration: durationForType(appt.type),
  doctor: appt.doctorName,
  doctorId: appt.staffCode,
  room: '—',
  department: departmentForType(appt.type),
  chiefComplaint: appt.notes?.trim() || '—',
  symptoms: [],
  patientPhone: patient?.mobile ?? '—',
  patientAge: patient ? `${patient.age} yrs` : '—',
  patientPrakriti: patient?.prakriti,
  checkInTime: appt.status === 'In' ? formatTimeLabel(appt.time) : undefined,
  clinicalNotes: [
    { label: 'Prakriti', value: patient?.prakriti ?? '—' },
    { label: 'Treatment', value: patient?.treatment ?? '—' },
    { label: 'Last Visit', value: patient?.lastVisit ?? '—' },
  ],
  doctorNotes: appt.notes,
  prepInstructions: [],
  activityLog: [
    {
      id: `${appt.id}-scheduled`,
      title: 'Appointment Scheduled',
      date: `${formatDateLabel(appt.date)} · ${formatTimeLabel(appt.time)}`,
      description: `${appt.type} for ${appt.patientName} with ${appt.doctorName}.`,
      actor: appt.doctorName,
    },
  ],
  documents: [],
});

export const buildCalendarDots = (
  appointments: Appointment[],
  month: number,
  year: number
): Record<number, CalendarDotType[]> => {
  const dots: Record<number, CalendarDotType[]> = {};

  for (const appt of appointments) {
    const iso = appt.date.slice(0, 10);
    const d = new Date(`${iso}T12:00:00`);
    if (d.getMonth() !== month || d.getFullYear() !== year) continue;

    const day = d.getDate();
    const dot: CalendarDotType =
      appt.type === 'Panchakarma' || appt.type === 'Shodhana'
        ? 'panchakarma'
        : appt.status === 'In'
          ? 'checked-in'
          : 'upcoming';

    if (!dots[day]) dots[day] = [];
    if (!dots[day].includes(dot)) dots[day].push(dot);
  }

  return dots;
};

export const isTodayIso = (iso: string) => {
  const today = new Date().toISOString().slice(0, 10);
  return iso === today;
};
