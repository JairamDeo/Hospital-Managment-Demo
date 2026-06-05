import moment from 'moment';

export const PANCHAKARMA_THERAPIES = ['Vamana', 'Virechana', 'Basti', 'Nasya'];

export const PANCHAKARMA_ROOMS = ['Room 1', 'Room 2', 'Room 3', 'Room 4'];

export const PANCHAKARMA_DAY_OPTIONS = [7, 8, 10, 14, 21];

export const normalizeProgramStartDate = (dateInput) => {
  const parsed = moment(dateInput, ['YYYY-MM-DD', moment.ISO_8601], true);
  if (!parsed.isValid()) throw new Error('Invalid start date');
  return parsed.startOf('day').toDate();
};

export const formatProgramStartDateIso = (date) => moment(date).format('YYYY-MM-DD');

export const formatProgramStartDateDisplay = (date) => moment(date).format('MMM D, YYYY');

export const computeProgramProgress = (currentDay, totalDays) => {
  if (!totalDays) return 0;
  return Math.min(100, Math.round((currentDay / totalDays) * 100));
};

export const deriveProgramStatus = (currentDay, totalDays, storedStatus) => {
  if (storedStatus === 'Cancelled') return 'Cancelled';
  if (currentDay >= totalDays) return 'Complete';
  if (currentDay <= 1) return 'Starting';
  return 'Ongoing';
};
