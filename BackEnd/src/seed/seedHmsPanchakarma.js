import HmsPanchakarmaProgram from '../models/hmsPanchakarmaProgram.model.js';
import HmsPatient from '../models/hmsPatient.model.js';
import HmsStaff from '../models/hmsStaff.model.js';
import RoomMaster from '../models/roomMaster.model.js';
import { logger } from '../utils/logger.js';
import { normalizeProgramStartDate } from '../utils/panchakarma.util.js';

const SEED_PROGRAMS = [
  {
    programCode: 'PK-001',
    patientCode: 'AH-10018',
    staffCode: 'STF-002',
    therapy: 'Vamana',
    totalDays: 7,
    currentDay: 3,
    roomName: 'Room 1',
    startDate: '2026-05-01',
    status: 'Ongoing',
  },
  {
    programCode: 'PK-002',
    patientCode: 'AH-10031',
    staffCode: 'STF-003',
    therapy: 'Virechana',
    totalDays: 10,
    currentDay: 5,
    roomName: 'Room 2',
    startDate: '2026-04-28',
    status: 'Ongoing',
  },
  {
    programCode: 'PK-003',
    patientCode: 'AH-10055',
    staffCode: 'STF-004',
    therapy: 'Nasya',
    totalDays: 14,
    currentDay: 1,
    roomName: 'Room 3',
    startDate: '2026-06-05',
    status: 'Starting',
  },
];

export const seedHmsPanchakarma = async () => {
  let created = 0;
  let updated = 0;

  for (const row of SEED_PROGRAMS) {
    const [patient, therapist] = await Promise.all([
      HmsPatient.findOne({ patientCode: row.patientCode }),
      HmsStaff.findOne({ staffCode: row.staffCode }),
    ]);
    if (!patient || !therapist) continue;

    const room = await RoomMaster.findOne({ name: row.roomName, roomType: 'Panchakarma' });
    if (!room) continue;

    const payload = {
      ...row,
      roomCode: room.code,
      room: room.name,
      patient: patient._id,
      patientName: patient.name,
      staff: therapist._id,
      therapistName: therapist.name,
      startDate: normalizeProgramStartDate(row.startDate),
      createdBy: { type: 'admin', name: 'System Seed' },
    };
    delete payload.roomName;

    const existing = await HmsPanchakarmaProgram.findOne({ programCode: row.programCode });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      updated += 1;
    } else {
      await HmsPanchakarmaProgram.create(payload);
      created += 1;
    }
  }

  logger.info(
    `HMS panchakarma seed: ${created} created, ${updated} updated (${SEED_PROGRAMS.length} total)`
  );
};
