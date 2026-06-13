import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, FileText, Stethoscope, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formLabelClass, formSelectClass, formTextareaClass } from '@/components/ui/formStyles';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { ROUTES, patientDetailPath } from '@/constants/routes';
import { ipdAdminService } from '@/services/ipd/ipdAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';
import { formatDoctorLabel, formatIpdDateTime } from '@/utils/ipdHelpers';
import type {
  CaseNoteFormValues,
  DischargeFormValues,
  IpdAdmission,
} from '@/types/ipd.types';

const emptyCaseNote = (): CaseNoteFormValues => ({
  treatmentGiven: '',
  medicines: '',
  observations: '',
});

const emptyDischarge = (admission?: IpdAdmission | null): DischargeFormValues => ({
  diagnosis: admission?.diagnosis ?? '',
  treatmentSummary: '',
  medicinesAtDischarge: '',
  advice: '',
  followUpDate: '',
});

const InfoBlock = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof User;
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-xl border border-border-sage bg-white p-4">
    <div className="flex items-center gap-2 text-ink-ghost">
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
    </div>
    <p className="mt-2 text-sm font-medium text-ink">{value || '—'}</p>
    {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
  </div>
);

export const IpdAdmissionDetailPage = () => {
  const { admissionCode } = useParams<{ admissionCode: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { canEdit } = usePermissions();
  const canManage = canEdit('ipd');

  const [admission, setAdmission] = useState<IpdAdmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [caseNoteForm, setCaseNoteForm] = useState(emptyCaseNote());
  const [dischargeForm, setDischargeForm] = useState(emptyDischarge());
  const [dischargeOpen, setDischargeOpen] = useState(false);

  const load = useCallback(async () => {
    if (!admissionCode) return;
    setLoading(true);
    try {
      const { data } = await ipdAdminService.getAdmission(admissionCode);
      const row = data.res?.admission;
      if (!row) throw new Error('Admission not found');
      setAdmission(row);
      setDischargeForm(emptyDischarge(row));
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setAdmission(null);
    } finally {
      setLoading(false);
    }
  }, [admissionCode, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAddCaseNote = async () => {
    if (!admission) return;
    if (!caseNoteForm.treatmentGiven.trim() && !caseNoteForm.observations.trim()) {
      showToast('Enter treatment or daily observations', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await ipdAdminService.addCaseNote(admission.admissionCode, caseNoteForm);
      setAdmission(data.res?.admission ?? admission);
      setCaseNoteForm(emptyCaseNote());
      showToast('Daily record saved', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischarge = async () => {
    if (!admission) return;
    if (!dischargeForm.treatmentSummary.trim()) {
      showToast('Treatment summary is required for discharge', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await ipdAdminService.discharge(admission.admissionCode, dischargeForm);
      showToast('Patient discharged — bed is now available', 'success');
      navigate(ROUTES.ADMIN_IPD);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!admissionCode) {
    return <Navigate to={ROUTES.ADMIN_IPD} replace />;
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-ink-soft">Loading admission record…</div>
    );
  }

  if (!admission) {
    return <Navigate to={ROUTES.ADMIN_IPD} replace />;
  }

  const isAdmitted = admission.status === 'Admitted';

  return (
    <div className="mx-auto w-full max-w-[1280px] pb-8">
      <div className="mb-5">
        <Link
          to={ROUTES.ADMIN_IPD}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-deep hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to IPD
        </Link>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-[300px] xl:w-[320px]">
          <div className="rounded-xl border border-border-sage bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold ${admission.avatarClass}`}
              >
                {admission.initials}
              </div>
              <div className="min-w-0">
                <p className="font-serif text-xl font-semibold text-ink">{admission.patientName}</p>
                <p className="text-xs text-ink-soft">{admission.patientCode}</p>
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    isAdmitted
                      ? 'bg-success-bg text-success'
                      : 'bg-sage-mist text-ink-soft'
                  }`}
                >
                  {admission.status}
                </span>
              </div>
            </div>

            <dl className="mt-5 space-y-3 border-t border-border-sage pt-4 text-sm">
              <div>
                <dt className="text-[10px] font-bold uppercase text-ink-ghost">Admission ID</dt>
                <dd className="mt-0.5 font-medium text-ink">{admission.admissionCode}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-ink-ghost">Room</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {admission.roomName}
                  <span className="text-ink-soft"> · #{admission.roomNumber}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-ink-ghost">Attending doctor</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {formatDoctorLabel(admission.doctorName)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-ink-ghost">Admitted</dt>
                <dd className="mt-0.5 text-ink">{formatIpdDateTime(admission.admittedAt)}</dd>
              </div>
              {admission.expectedDischargeAt ? (
                <div>
                  <dt className="text-[10px] font-bold uppercase text-ink-ghost">Expected discharge</dt>
                  <dd className="mt-0.5 text-ink">{formatIpdDateTime(admission.expectedDischargeAt)}</dd>
                </div>
              ) : null}
              {admission.dischargedAt ? (
                <div>
                  <dt className="text-[10px] font-bold uppercase text-ink-ghost">Discharged</dt>
                  <dd className="mt-0.5 text-ink">{formatIpdDateTime(admission.dischargedAt)}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-5 flex flex-col gap-2">
              <Link
                to={patientDetailPath(admission.patientCode)}
                className="inline-flex items-center justify-center rounded-lg border border-border-sage bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-sage-mist/50"
              >
                View patient profile
              </Link>
              {canManage && isAdmitted ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setDischargeForm(emptyDischarge(admission));
                    setDischargeOpen(true);
                  }}
                >
                  Discharge patient
                </Button>
              ) : null}
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoBlock
              icon={Stethoscope}
              label="Provisional diagnosis"
              value={admission.diagnosis}
              hint="Working diagnosis at admission"
            />
            <InfoBlock
              icon={ClipboardList}
              label="Reason for Admit"
              value={admission.chiefComplaint}
              hint="Main symptoms or complaint when patient was admitted"
            />
          </div>

          <div className="rounded-xl border border-border-sage bg-white">
            <div className="flex items-center justify-between border-b border-border-sage px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">Daily treatment record</h2>
              <span className="text-xs text-ink-soft">{admission.caseNotes.length} entries</span>
            </div>
            <div className="p-4">
              {admission.caseNotes.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-soft">
                  No daily records yet. Add medicines, therapies and observations below.
                </p>
              ) : (
                <div className="space-y-3">
                  {[...admission.caseNotes].reverse().map((n) => (
                    <article
                      key={n.id}
                      className="rounded-lg border border-border-sage/80 bg-cream/30 p-4"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-ghost">
                        {formatIpdDateTime(n.noteDate)}
                        {n.recordedBy?.name ? ` · ${n.recordedBy.name}` : ''}
                      </p>
                      {n.treatmentGiven ? (
                        <p className="mt-2 text-sm">
                          <span className="font-semibold text-ink">Treatment:</span>{' '}
                          <span className="text-ink-soft">{n.treatmentGiven}</span>
                        </p>
                      ) : null}
                      {n.medicines ? (
                        <p className="mt-1.5 text-sm">
                          <span className="font-semibold text-ink">Medicines:</span>{' '}
                          <span className="text-ink-soft">{n.medicines}</span>
                        </p>
                      ) : null}
                      {n.observations ? (
                        <p className="mt-1.5 text-sm">
                          <span className="font-semibold text-ink">Observations:</span>{' '}
                          <span className="text-ink-soft">{n.observations}</span>
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          {canManage && isAdmitted ? (
            <div className="rounded-xl border border-dashed border-sage-deep/40 bg-sage-mist/20 p-5">
              <h3 className="mb-1 text-sm font-semibold text-ink">Add daily record</h3>
              <p className="mb-4 text-xs text-ink-soft">
                Document today&apos;s Panchakarma, medicines, diet and clinical observations.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Treatment / therapy given"
                  value={caseNoteForm.treatmentGiven}
                  onChange={(e) =>
                    setCaseNoteForm((f) => ({ ...f, treatmentGiven: e.target.value }))
                  }
                  placeholder="e.g. Basti, abhyanga, diet plan"
                />
                <Input
                  label="Medicines administered"
                  value={caseNoteForm.medicines}
                  onChange={(e) => setCaseNoteForm((f) => ({ ...f, medicines: e.target.value }))}
                  placeholder="e.g. Kashayam 20ml BD"
                />
                <div className="sm:col-span-2">
                  <label className={formLabelClass}>Clinical observations</label>
                  <textarea
                    className={formTextareaClass}
                    rows={3}
                    value={caseNoteForm.observations}
                    onChange={(e) =>
                      setCaseNoteForm((f) => ({ ...f, observations: e.target.value }))
                    }
                    placeholder="Vitals, response to treatment, nursing notes…"
                  />
                </div>
              </div>
              <Button className="mt-4" onClick={handleAddCaseNote} isLoading={submitting}>
                Save daily record
              </Button>
            </div>
          ) : null}

          {!isAdmitted && admission.dischargeSummary ? (
            <div className="rounded-xl border border-border-sage bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-sage-deep" />
                <h2 className="text-sm font-semibold text-ink">Discharge summary</h2>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[10px] font-bold uppercase text-ink-ghost">Final diagnosis</dt>
                  <dd className="mt-1 text-sm text-ink">
                    {admission.dischargeSummary.diagnosis || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase text-ink-ghost">Follow-up</dt>
                  <dd className="mt-1 text-sm text-ink">
                    {admission.dischargeSummary.followUpDate
                      ? formatIpdDateTime(admission.dischargeSummary.followUpDate)
                      : '—'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase text-ink-ghost">Treatment summary</dt>
                  <dd className="mt-1 text-sm text-ink-soft">
                    {admission.dischargeSummary.treatmentSummary}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase text-ink-ghost">
                    Medicines at discharge
                  </dt>
                  <dd className="mt-1 text-sm text-ink-soft">
                    {admission.dischargeSummary.medicinesAtDischarge || '—'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase text-ink-ghost">Advice</dt>
                  <dd className="mt-1 text-sm text-ink-soft">
                    {admission.dischargeSummary.advice || '—'}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
        </section>
      </div>

      <Modal
        open={dischargeOpen}
        onClose={() => setDischargeOpen(false)}
        title="Discharge summary"
        subtitle={`${admission.roomName} bed will be freed after discharge`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDischargeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDischarge} isLoading={submitting}>
              Confirm discharge
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Final diagnosis"
            value={dischargeForm.diagnosis}
            onChange={(e) => setDischargeForm((f) => ({ ...f, diagnosis: e.target.value }))}
          />
          <div>
            <label className={formLabelClass}>Treatment summary *</label>
            <textarea
              className={formTextareaClass}
              rows={3}
              value={dischargeForm.treatmentSummary}
              onChange={(e) => setDischargeForm((f) => ({ ...f, treatmentSummary: e.target.value }))}
              placeholder="Complete course of IPD treatment given"
            />
          </div>
          <Input
            label="Medicines at discharge"
            value={dischargeForm.medicinesAtDischarge}
            onChange={(e) =>
              setDischargeForm((f) => ({ ...f, medicinesAtDischarge: e.target.value }))
            }
          />
          <div>
            <label className={formLabelClass}>Diet & lifestyle advice</label>
            <textarea
              className={formTextareaClass}
              rows={2}
              value={dischargeForm.advice}
              onChange={(e) => setDischargeForm((f) => ({ ...f, advice: e.target.value }))}
            />
          </div>
          <div>
            <label className={formLabelClass}>Follow-up date</label>
            <input
              type="date"
              className={formSelectClass}
              value={dischargeForm.followUpDate}
              onChange={(e) => setDischargeForm((f) => ({ ...f, followUpDate: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IpdAdmissionDetailPage;
