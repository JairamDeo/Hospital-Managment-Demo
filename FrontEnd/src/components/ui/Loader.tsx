interface ContentLoaderProps {
  /** Visual size */
  size?: 'sm' | 'md' | 'lg';
  /** Optional short caption under the spinner */
  label?: string;
  /** Extra vertical padding wrapper */
  className?: string;
}

const sizeMap = {
  sm: { ring: 'h-7 w-7 border-[2.5px]', wrap: 'py-8' },
  md: { ring: 'h-9 w-9 border-[3px]', wrap: 'py-14' },
  lg: { ring: 'h-11 w-11 border-[3px]', wrap: 'py-20' },
};

/** Sleek animated spinner for in-page / section loading states */
export const ContentLoader = ({
  size = 'md',
  label,
  className = '',
}: ContentLoaderProps) => {
  const s = sizeMap[size];
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${s.wrap} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex items-center justify-center">
        <span
          className={`absolute rounded-full bg-sage-mist/70 ${s.ring} animate-ping opacity-40`}
          aria-hidden
        />
        <span
          className={`relative animate-spin rounded-full border-sage-pale/80 border-t-sage-deep ${s.ring}`}
          aria-hidden
        />
      </div>
      {label ? (
        <p className="text-xs font-medium tracking-wide text-ink-soft">{label}</p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
};

/** Compact inline spinner (tables, buttons, small panels) */
export const InlineLoader = ({ className = '' }: { className?: string }) => (
  <span
    className={`inline-flex items-center justify-center ${className}`}
    role="status"
    aria-label="Loading"
  >
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-sage-pale border-t-sage-deep" />
  </span>
);

/** Full-viewport auth / app bootstrap loader */
export const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-cream">
    <ContentLoader size="lg" />
  </div>
);
