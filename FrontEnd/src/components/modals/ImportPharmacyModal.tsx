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
              <strong>CSV only.</strong> Columns: Item Code, Item Name, Company, Category,{' '}
              <strong>Item Type</strong> (Single item / Box / Powder / Churan),{' '}
              <strong>Units Per Pack</strong>, Pack Unit, Stock, dates, Monthly Usage %, and{' '}
              <strong>Sale Price</strong>.
            </li>
            <li>
              <strong>Item types:</strong> Single item = price per piece, stock in pieces. Box =
              tablets per box, stock in <strong>boxes</strong>, price per box. Powder / Churan
              = grams per box, stock in <strong>boxes</strong>, price per box.
            </li>
            <li>
              <strong>Units Per Pack:</strong> tablets in 1 box (e.g. 30), grams in 1 box (e.g.
              100), or 1 for single items. <strong>Pack Unit</strong> must match Master Data (e.g.
              tablet, g, bottle) — new labels are created for single items.
            </li>
            <li>
              <strong>Shelf life:</strong> enter <strong>Expiry Date</strong> or{' '}
              <strong>Best Before Months</strong> from manufacturing (at least one required).
            </li>
            <li>
              <strong>Same medicine, different brands:</strong> use the <strong>Company</strong>{' '}
              column. Matching is by <strong>Item Name + Company</strong>, or by Item Code.
            </li>
            <li>
              <strong>Update existing stock:</strong> include the existing <strong>Item Code</strong>{' '}
              or the same Name + Company. Type, pack size, stock, price, and category will be
              updated.
            </li>
            <li>
              <strong>New products:</strong> leave Item Code blank. A new code is generated
              automatically (e.g. item-001/06-26). <strong>Sale Price is required</strong> for new
              items.
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
            {lastSummary.warnings && lastSummary.warnings.length > 0 ? (
              <ul className="mt-2 text-xs text-amber-700">
                {lastSummary.warnings.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            ) : null}
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
