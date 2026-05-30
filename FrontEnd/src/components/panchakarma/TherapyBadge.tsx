import type { TherapyType } from '@/pages/panchakarma/data/mockPanchakarma';
import { THERAPY_STYLES } from '@/pages/panchakarma/data/mockPanchakarma';

export const TherapyBadge = ({ therapy }: { therapy: TherapyType }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${THERAPY_STYLES[therapy].badge}`}
  >
    {therapy}
  </span>
);
