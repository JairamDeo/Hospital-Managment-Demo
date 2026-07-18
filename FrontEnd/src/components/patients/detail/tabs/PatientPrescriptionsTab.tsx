import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Download, Eye, FileText, Loader2, MessageCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { prescriptionPath } from '@/constants/routes';
import { patientAdminService } from '@/services/patient/patientAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';
import type { StructuredPrescription } from '@/types/structuredPrescription.types';

interface Props {
  patientCode: string;
  prescriptions: StructuredPrescription[];
  loading?: boolean;
  canCreate?: boolean;
  onRefresh?: () => void | Promise<void>;
}

export const PatientPrescriptionsTab = ({
  patientCode,
  prescriptions,
  loading = false,
  canCreate = false,
  onRefresh,
}: Props) => {
  const { showToast } = useToast();
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [waLoading, setWaLoading] = useState<string | null>(null);

  const openPdf = async (code: string, audience: 'patient' | 'staff', download = false) => {
    setPdfLoading(`${code}-${audience}`);
    try {
      const blob = await patientAdminService.fetchStructuredPrescriptionPdfBlob(
        patientCode,
        code,
        audience
      );
      const url = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${code}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setPdfLoading(null);
    }
  };

  const sendWhatsApp = async (code: string) => {
    setWaLoading(code);
    try {
      const { data } = await patientAdminService.sendStructuredPrescriptionWhatsApp(
        patientCode,
        code
      );
      const res = data.res;
      const channels: string[] = [];
      if (res?.whatsappSent) channels.push('WhatsApp');
      if (res?.emailSent) channels.push('Email');
      if (channels.length) {
        showToast(`Prescription sent via ${channels.join(' & ')}`, 'success');
      }
      if (res?.whatsapp?.skipped && !res?.whatsappSent) {
        showToast(
          res.whatsapp.reason?.includes('already sent')
            ? 'WhatsApp already sent for this prescription'
            : 'Patient does not have a WhatsApp number on file',
          'info'
        );
      }
      if (res?.email?.skipped && !res?.emailSent) {
        showToast('Patient does not have an email address on file', 'info');
      }
      await onRefresh?.();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setWaLoading(null);
    }
  };

  const formatWaSentDate = (iso?: string | null) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      {canCreate ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-sage bg-cream/30 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-ink">Structured prescriptions</p>
            <p className="text-xs text-ink-ghost">Create medicine and churan prescriptions with PDF export</p>
          </div>
          <Link to={prescriptionPath(patientCode)}>
            <Button type="button" className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" strokeWidth={2} />
              New prescription
            </Button>
          </Link>
        </div>
      ) : null}

      {prescriptions.length === 0 ? (
        <div className="rounded-xl border border-border-sage bg-cream/20 px-4 py-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-ink-ghost" strokeWidth={1.5} />
          <p className="mt-2 text-sm font-medium text-ink-soft">No prescriptions yet</p>
          {canCreate ? (
            <p className="mt-1 text-xs text-ink-ghost">Create a structured prescription for this patient</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            Prescriptions ({prescriptions.length})
          </p>
          {prescriptions.map((rx) => {
            const waAlreadySent = Boolean(rx.whatsappSentAt);
            return (
              <div
                key={rx.prescriptionCode}
                className="flex items-center gap-3 rounded-xl border border-border-sage bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sage-mist text-sage-deep">
                  <FileText className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {rx.diagnosis?.trim() || rx.prescriptionCode}
                  </p>
                  <p className="text-xs text-ink-ghost">
                    {rx.prescriptionCode}
                    {rx.doctorName ? ` · ${rx.doctorName}` : ''}
                    {rx.createdAt
                      ? ` · ${new Date(rx.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}`
                      : ''}
                  </p>
                  {(rx.recommendedTests?.length ?? 0) > 0 ? (
                    <p className="mt-1 text-[11px] text-ink-soft">
                      Lab tests:{' '}
                      {rx.recommendedTests!.map((t) => t.testName).join(', ')}
                    </p>
                  ) : null}
                  {waAlreadySent ? (
                    <p className="mt-0.5 text-[10px] font-medium text-emerald-700">
                      WhatsApp sent {formatWaSentDate(rx.whatsappSentAt)}
                      {rx.whatsappSentBy ? ` · by ${rx.whatsappSentBy}` : ''}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={pdfLoading === `${rx.prescriptionCode}-staff`}
                    onClick={() => void openPdf(rx.prescriptionCode, 'staff')}
                    className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-sage-mist hover:text-sage-deep disabled:opacity-50"
                    title="View PDF (staff)"
                  >
                    <Eye className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    disabled={pdfLoading === `${rx.prescriptionCode}-patient`}
                    onClick={() => void openPdf(rx.prescriptionCode, 'patient', true)}
                    className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-sage-mist hover:text-sage-deep disabled:opacity-50"
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    disabled={waAlreadySent || waLoading === rx.prescriptionCode}
                    onClick={() => void sendWhatsApp(rx.prescriptionCode)}
                    className={`rounded-lg p-2 disabled:opacity-50 ${
                      waAlreadySent
                        ? 'cursor-not-allowed bg-emerald-50 text-emerald-600'
                        : 'cursor-pointer text-ink-ghost hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                    title={
                      waAlreadySent
                        ? `WhatsApp sent on ${formatWaSentDate(rx.whatsappSentAt)}`
                        : 'Send on WhatsApp'
                    }
                  >
                    {waLoading === rx.prescriptionCode ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                    ) : waAlreadySent ? (
                      <Check className="h-4 w-4" strokeWidth={2} />
                    ) : (
                      <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
