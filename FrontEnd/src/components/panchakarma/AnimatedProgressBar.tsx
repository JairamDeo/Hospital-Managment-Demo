import { useEffect, useState } from 'react';

interface Props {
  progress: number;
}

export const AnimatedProgressBar = ({ progress }: Props) => {
  const target = Math.min(100, Math.max(0, progress));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(0);
    const frame = requestAnimationFrame(() => {
      setWidth(target);
    });
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <div className="flex min-w-[100px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sage-mist">
        <div
          className="progress-bar-fill relative h-full overflow-hidden rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${width}%` }}
        >
          {width > 0 ? <span className="progress-bar-shimmer absolute inset-0" aria-hidden /> : null}
        </div>
      </div>
      <span className="w-8 text-right text-xs font-semibold text-ink-soft">{progress}%</span>
    </div>
  );
};
