import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { PharmacyImportSummary } from '@/types/pharmacy.types';

interface Props {
  open: boolean;
  uploading?: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void | Promise<void>;
  onImport: (file: File) => void | Promise<void>;
  lastSummary?: PharmacyImportSummary | null;
}

export const ImportPharmacyModal = ({
  open,
  uploading = false,
  onClose,
  onDownloadTemplate,
  onImport,
  lastSummary,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return;
    }
    setFileName(file.name);
    onImport(file);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import inventory (CSV)"
      subtitle="Bulk upload or update pharmacy stock from a spreadsheet"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={uploading}>
            Close
          </Button>
          <Button
            className="gap-2"
            variant="secondary"
            onClick={onDownloadTemplate}
            disabled={uploading}
          >
            <Download className="h-4 w-4" strokeWidth={1.75} />
            Download template
          </Button>
          <Button
            className="gap-2"
            onClick={() => inputRef.current?.click()}
            isLoading={uploading}
          >
            <Upload className="h-4 w-4" strokeWidth={1.75} />
            Choose CSV file
          </Button>
        </>
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <div className="space-y-4 text-sm text-ink-soft">
        <div className="rounded-lg border border-border-sage bg-cream/40 p-4">
          <p className="font-semibold text-ink">How bulk import works</p>
          <ul className="mt-2 list-inside list-disc space-y-1.5">
            <li>
              <strong>CSV only.</strong> Columns include Item Code, Item Name, Company, Category,
              Pack Quantity, Pack Unit, Stock, Manufacturing Date, Expiry Date (or Best Before
              Months), Monthly Usage %.
            </li>
            <li>
              <strong>Shelf life:</strong> enter <strong>Expiry Date</strong> or{' '}
              <strong>Best Before Months</strong> from manufacturing (at least one required).
            </li>
            <li>
              <strong>Same medicine, different brands:</strong> use the <strong>Company</strong>{' '}
              column (e.g. Dabur vs Patanjali). Matching is by{' '}
              <strong>Item Name + Company</strong>, not name alone.
            </li>
            <li>
              <strong>Update existing stock:</strong> include the existing <strong>Item Code</strong>{' '}
              or the same Name + Company. Pack quantity, unit, stock, and category will be updated.
            </li>
            <li>
              <strong>New products:</strong> leave Item Code blank. A new code is generated
              automatically (e.g. item-001/mm-yy).
            </li>
            <li>
              Category and Pack Unit must match names in <strong>Master Data</strong> (e.g.
              Medicated Oil, ml, g, L).
            </li>
          </ul>
        </div>

        {fileName ? (
          <p className="text-xs text-ink-ghost">
            Last selected file: <span className="font-medium text-ink">{fileName}</span>
          </p>
        ) : null}

        {lastSummary ? (
          <div className="rounded-lg border border-border-sage bg-white p-4">
            <p className="font-semibold text-ink">Import result</p>
            <p className="mt-1">
              Created: <strong>{lastSummary.created}</strong> · Updated:{' '}
              <strong>{lastSummary.updated}</strong> · Failed:{' '}
              <strong className={lastSummary.failed ? 'text-danger' : ''}>
                {lastSummary.failed}
              </strong>
            </p>
            {lastSummary.errors.length > 0 ? (
              <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-danger">
                {lastSummary.errors.slice(0, 8).map((err) => (
                  <li key={`${err.line}-${err.message}`}>
                    Row {err.line}: {err.message}
                  </li>
                ))}
                {lastSummary.errors.length > 8 ? (
                  <li>…and {lastSummary.errors.length - 8} more</li>
                ) : null}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
