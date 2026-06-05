import type { HmsAppointment } from '@/types/api.types';
import type { Appointment, AppointmentFormValues, AppointmentType } from '@/types/appointment.types';
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
  date: a.date,
  time: a.time,
  status: (a.adminStatus ?? 'Soon') as Appointment['status'],
  notes: a.notes,
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
