interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export const SettingsToggle = ({ checked, onChange, label, description }: Props) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <div className="min-w-0">
      <p className="text-sm font-medium text-ink">{label}</p>
      {description ? <p className="mt-0.5 text-xs text-ink-soft">{description}</p> : null}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
        checked ? 'bg-sage-deep' : 'bg-sage-pale'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);
