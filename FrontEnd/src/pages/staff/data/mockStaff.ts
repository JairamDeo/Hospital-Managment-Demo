/** @deprecated List data comes from API. Types/helpers moved to @/types/staff.types and @/utils/staffHelpers. */
export type {
  StaffRole,
  StaffFilter,
  DutyStatus,
  StaffMember,
  StaffFormValues,
  StaffStats,
} from '@/types/staff.types';

export { ROLE_OPTIONS } from '@/types/staff.types';

export {
  emptyStaffForm,
  filterToRole,
  getInitials,
  pickAvatarClass,
  defaultStaffStats,
} from '@/utils/staffHelpers';

/** Static fallback for detail page / global search until staff detail API is wired. */
export { MOCK_STAFF, STAFF_STATS } from './mockStaffData';
