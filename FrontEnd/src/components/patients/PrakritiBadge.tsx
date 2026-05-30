import type { PrakritiType } from '@/pages/patients/data/mockPatients';

const styles: Record<PrakritiType, string> = {
  Vata: 'bg-violet-100 text-violet-700',
  Pitta: 'bg-orange-100 text-orange-700',
  Kapha: 'bg-sage-pale text-sage-deep',
};

export const PrakritiBadge = ({ prakriti }: { prakriti: PrakritiType }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[prakriti]}`}>
    {prakriti}
  </span>
);
