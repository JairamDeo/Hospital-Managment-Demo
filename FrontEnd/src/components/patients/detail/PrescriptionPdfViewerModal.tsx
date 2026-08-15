import { useCallback, useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { patientAdminService } from '@/services/patient/patientAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';
import type { PatientPrescriptionPdf } from '@/types/patientPrescription.types';

interface Props {
  patientCode: string;
  prescription: PatientPrescriptionPdf | null;
  onClose: () => void;
}

export const PrescriptionPdfViewerModal = ({ patientCode, prescription, onClose }: Props) => {
  const open = Boolean(prescription);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPdf = useCallback(async () => {
    if (!prescription) return;
    setLoading(true);
    setError(null);
    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    try {
      const blob = await patientAdminService.fetchPrescriptionPdfBlob(patientCode, prescription.id);
      if (!blob.type || blob.type === 'application/octet-stream') {
        setPdfUrl(URL.createObjectURL(new Blob([blob], { type: 'application/pdf' })));
      } else {
        setPdfUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load PDF document.'));
    } finally {
      setLoading(false);
    }
  }, [patientCode, prescription]);

  useEffect(() => {
    if (!open) {
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setError(null);
      return;
    }
    void loadPdf();
  }, [open, loadPdf]);

  useEffect(
    () => () => {
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    },
    []
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={prescription?.title ?? 'Prescription'}
      subtitle={prescription?.fileName}
      size="lg"
      contentClassName="!overflow-hidden !p-0"
      footer={
        prescription ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <a
              href={prescription.url}
              download={prescription.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-sage-deep px-4 py-2 text-sm font-semibold text-white hover:bg-sage-mid"
            >
              <Download className="h-4 w-4" strokeWidth={2} />
              Download
            </a>
          </>
        ) : undefined
      }
    >
      {prescription ? (
        <div className="relative flex h-[min(62vh,560px)] min-h-[300px] flex-col bg-ink/5">
          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-ink-soft">
              <Loader2 className="h-6 w-6 animate-spin text-sage-deep" />
              Loading PDF…
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-danger">{error}</p>
              <Button type="button" onClick={() => void loadPdf()}>
                Try again
              </Button>
            </div>
          ) : pdfUrl ? (
            <iframe title={prescription.title} src={pdfUrl} className="h-full w-full border-0 bg-white" />
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
};
