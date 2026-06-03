import { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  onExportCsv: () => void;
  onExportPdf: () => void;
  disabled?: boolean;
}

export const ExportPharmacyMenu = ({ onExportCsv, onExportPdf, disabled }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="secondary"
        className="gap-2 rounded-lg px-4 py-2"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        Export
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 min-w-[180px] rounded-lg border border-border-sage bg-white py-1 shadow-lg">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-sage-mist/60"
            onClick={() => {
              setOpen(false);
              onExportCsv();
            }}
          >
            <FileSpreadsheet className="h-4 w-4 text-sage-deep" strokeWidth={1.75} />
            Export to CSV
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-sage-mist/60"
            onClick={() => {
              setOpen(false);
              onExportPdf();
            }}
          >
            <FileText className="h-4 w-4 text-sage-deep" strokeWidth={1.75} />
            Export to PDF
          </button>
        </div>
      ) : null}
    </div>
  );
};
