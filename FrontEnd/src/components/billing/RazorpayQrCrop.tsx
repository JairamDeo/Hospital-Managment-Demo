import { useCallback, useState } from 'react';

interface Props {
  src: string;
  size?: number;
}

/** Top whitespace on Razorpay posters (empty header area above branding). */
const TOP_WHITESPACE_RATIO = 0.28;

export const RazorpayQrCrop = ({ src, size = 280 }: Props) => {
  const [frame, setFrame] = useState<{ height: number; offset: number } | null>(null);

  const onLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      if (!naturalWidth || !naturalHeight) return;

      const displayHeight = (naturalHeight / naturalWidth) * size;
      const offset = displayHeight * TOP_WHITESPACE_RATIO;
      setFrame({ height: displayHeight - offset, offset });
    },
    [size]
  );

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm"
      style={{ width: size, height: frame?.height ?? size * 0.72 }}
    >
      <img
        src={src}
        alt="UPI QR code — scan to pay"
        draggable={false}
        onLoad={onLoad}
        className="block max-w-none select-none"
        style={{
          width: size,
          marginTop: frame ? -frame.offset : 0,
          opacity: frame ? 1 : 0,
        }}
      />
    </div>
  );
};
