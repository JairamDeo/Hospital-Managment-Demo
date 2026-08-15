const styles: Record<string, string> = {
  Vata: 'bg-violet-100 text-violet-700',
  Pitta: 'bg-orange-100 text-orange-700',
  Kapha: 'bg-sage-pale text-sage-deep',
};

export const PrakritiBadge = ({ prakriti }: { prakriti: string }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
      styles[prakriti] ?? 'bg-sage-mist text-sage-deep'
    }`}
  >
    {prakriti}
  </span>
);
