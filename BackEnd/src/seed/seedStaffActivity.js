import moment from 'moment';
import StaffActivity from '../models/staffActivity.model.js';
import HmsStaff from '../models/hmsStaff.model.js';
import { logger } from '../utils/logger.js';

/** Seed sample check-in / check-out activity (not leave). */
export const seedStaffActivityIfEmpty = async () => {
  const existing = await StaffActivity.countDocuments();
  if (existing > 0) return;

  const staff = await HmsStaff.find({ status: true }).select('staffCode name shift');
  const entries = [];

  for (const member of staff) {
    for (let d = 1; d <= 3; d++) {
      const day = moment().subtract(d, 'days');
      if (day.day() === 0) continue;

      entries.push({
        staffCode: member.staffCode,
        activityType: 'check_in',
        title: 'Checked in',
        description: `${member.name} checked in for shift (${member.shift}).`,
        tags: ['Attendance'],
        performedBy: { type: 'staff', name: member.name, staffCode: member.staffCode },
        createdAt: day.hour(9).minute(5).toDate(),
      });
      entries.push({
        staffCode: member.staffCode,
        activityType: 'check_out',
        title: 'Checked out',
        description: `${member.name} checked out after shift.`,
        tags: ['Attendance'],
        performedBy: { type: 'staff', name: member.name, staffCode: member.staffCode },
        createdAt: day.hour(17).minute(10).toDate(),
      });
    }
  }

  if (entries.length) {
    await StaffActivity.insertMany(entries);
    logger.info(`Staff activity seed: ${entries.length} check-in/out records`);
  }
};
