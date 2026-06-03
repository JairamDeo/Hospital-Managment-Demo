import { useRef, useState } from 'react';
import { Download, Eye, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { PrescriptionPdfViewerModal } from '@/components/patients/detail/PrescriptionPdfViewerModal';
import type { PatientPrescriptionPdf } from '@/types/patientPrescription.types';

interface Props {
  patientCode: string;
  prescriptions: PatientPrescriptionPdf[];
  loading?: boolean;
  uploading?: boolean;
  readOnly?: boolean;
  onUpload: (file: File) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export const PatientPrescriptionsTab = ({
  patientCode,
  prescriptions,
  loading = false,
  uploading = false,
  readOnly = false,
  onUpload,
  onDelete,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [viewing, setViewing] = useState<PatientPrescriptionPdf | null>(null);
  const { showToast } = useToast();

  const pickFile = () => inputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      showToast('Only PDF files are allowed', 'error');
      return;
    }
    void onUpload(file);
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-ink-soft">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading prescriptions…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PrescriptionPdfViewerModal
        patientCode={patientCode}
        prescription={viewing}
        onClose={() => setViewing(null)}
      />
      {!readOnly ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragOver
              ? 'border-sage-deep bg-sage-mist/60'
              : 'border-border-sage bg-cream/30 hover:border-sage/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border-sage">
            <Upload className="h-5 w-5 text-sage-deep" strokeWidth={2} />
          </div>
          <p className="mt-3 text-sm font-semibold text-ink">Upload prescription PDF</p>
          <p className="mt-1 text-xs text-ink-ghost">
            Stored in Cloudinary · HMS/admin/{patientCode.replace(/\//g, '_')}/prescription
          </p>
          <Button
            type="button"
            className="mt-4 gap-2 rounded-xl"
            onClick={pickFile}
            isLoading={uploading}
            disabled={uploading}
          >
            <FileText className="h-4 w-4" strokeWidth={2} />
            Choose PDF
          </Button>
          <p className="mt-2 text-[11px] text-ink-ghost">PDF only · max 10 MB</p>
        </div>
      ) : null}

      {prescriptions.length === 0 ? (
        <div className="rounded-xl border border-border-sage bg-cream/20 px-4 py-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-ink-ghost" strokeWidth={1.5} />
          <p className="mt-2 text-sm font-medium text-ink-soft">No prescription PDFs yet</p>
          <p className="mt-1 text-xs text-ink-ghost">Upload a PDF to keep patient prescriptions on file</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            Uploaded PDFs ({prescriptions.length})
          </p>
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              role="button"
              tabIndex={0}
              onClick={() => setViewing(rx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setViewing(rx);
                }
              }}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-sage bg-white px-4 py-3 shadow-sm transition-colors hover:bg-sage-mist/30"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-danger-bg/80 text-danger">
                <FileText className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{rx.title}</p>
                <p className="text-xs text-ink-ghost">
                  {rx.uploadedAt}
                  {rx.sizeLabel ? ` · ${rx.sizeLabel}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewing(rx);
                  }}
                  className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-sage-mist hover:text-sage-deep"
                  title="View PDF"
                >
                  <Eye className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <a
                  href={rx.url}
                  download={rx.fileName}
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-sage-mist hover:text-sage-deep"
                  title="Download"
                >
                  <Download className="h-4 w-4" strokeWidth={1.75} />
                </a>
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onDelete(rx.id);
                    }}
                    className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-danger-bg hover:text-danger"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
