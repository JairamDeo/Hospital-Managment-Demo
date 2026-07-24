import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formLabelClass, formSelectClass, formInputClass } from '@/components/ui/formStyles';
import { useToast } from '@/hooks/useToast';
import {
  patientAdminService,
  type AiConsultationSample,
  type AiConsultationSummary,
} from '@/services/patient/patientAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';

interface Props {
  open: boolean;
  onClose: () => void;
  patientCode: string;
  patientName?: string;
}

export const AiConsultationModal = ({ open, onClose, patientCode, patientName }: Props) => {
  const { showToast } = useToast();
  const [samples, setSamples] = useState<AiConsultationSample[]>([]);
  const [sampleId, setSampleId] = useState('');
  const [discussionText, setDiscussionText] = useState('');
  const [summaries, setSummaries] = useState<AiConsultationSummary[]>([]);
  const [active, setActive] = useState<AiConsultationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [samplesRes, listRes] = await Promise.all([
        patientAdminService.listAiConsultationSamples(),
        patientAdminService.listAiConsultationSummaries(patientCode),
      ]);
      const sampleRows = samplesRes.data.res?.samples ?? [];
      setSamples(sampleRows);
      setSummaries(listRes.data.res?.summaries ?? []);
      if (sampleRows[0]) {
        setSampleId((prev) => prev || sampleRows[0].id);
        setDiscussionText((prev) => prev || sampleRows[0].discussionText);
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [patientCode, showToast]);

  useEffect(() => {
    if (!open) return;
    setActive(null);
    void load();
  }, [open, load]);

  const onSampleChange = (id: string) => {
    setSampleId(id);
    const s = samples.find((x) => x.id === id);
    if (s) setDiscussionText(s.discussionText);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await patientAdminService.generateAiConsultation(patientCode, {
        sampleId: sampleId || undefined,
        discussionText: discussionText.trim() || undefined,
      });
      const summary = data.res?.summary;
      if (summary) {
        setActive(summary);
        setSummaries((prev) => [summary, ...prev.filter((s) => s.summaryCode !== summary.summaryCode)]);
      }
      showToast('AI summary generated — review before prescribing', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="AI consultation summary"
      subtitle={
        patientName
          ? `${patientName} — uses discussion + patient profile (labs, Rx, vitals)`
          : 'Uses discussion + patient profile'
      }
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => void handleGenerate()} disabled={generating || loading}>
            {generating ? 'Generating…' : 'Generate summary'}
          </Button>
        </>
      }
    >
      {loading ? (
        <p className="py-6 text-sm text-ink-soft">Loading…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block">
              <span className={formLabelClass}>Sample discussion (no mic needed)</span>
              <select
                className={formSelectClass}
                value={sampleId}
                onChange={(e) => onSampleChange(e.target.value)}
              >
                {samples.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={formLabelClass}>Discussion text (edit or paste your own)</span>
              <textarea
                className={`${formInputClass} min-h-[220px] resize-y font-mono text-xs leading-relaxed`}
                value={discussionText}
                onChange={(e) => setDiscussionText(e.target.value)}
                placeholder="Doctor: … Patient: …"
              />
            </label>
            <p className="text-[11px] text-ink-ghost">
              Powered by Gemini. Free-tier limits &amp; key setup:{' '}
              <code className="rounded bg-cream px-1">BackEnd/docs/GEMINI_AI_CONSULTATION.md</code>
            </p>
            {summaries.length > 0 ? (
              <div>
                <p className={formLabelClass}>Previous summaries</p>
                <ul className="mt-1 max-h-28 space-y-1 overflow-y-auto">
                  {summaries.map((s) => (
                    <li key={s.summaryCode}>
                      <button
                        type="button"
                        className="w-full rounded-lg border border-border-sage/70 px-2 py-1.5 text-left text-xs hover:bg-sage-mist/40"
                        onClick={() => setActive(s)}
                      >
                        {s.summaryCode} · {s.chiefComplaint || 'Summary'} ·{' '}
                        {s.createdAt ? new Date(s.createdAt).toLocaleString('en-IN') : ''}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-xl border border-border-sage bg-cream/30 p-3">
            {!active ? (
              <p className="py-10 text-center text-sm text-ink-ghost">
                Generate or open a previous summary to view results here.
              </p>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sage-deep" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{active.chiefComplaint || 'Summary'}</p>
                    <p className="text-[11px] text-ink-ghost">
                      {active.summaryCode} · {active.model}
                      {active.tokenUsage?.totalTokens
                        ? ` · ${active.tokenUsage.totalTokens} tokens`
                        : ''}
                    </p>
                  </div>
                </div>
                <Section title="Clinical summary">{active.clinicalSummary}</Section>
                <Section title="Assessment">{active.assessment}</Section>
                {active.historyConsidered?.length ? (
                  <Section title="History considered">
                    <ul className="list-disc space-y-1 pl-4">
                      {active.historyConsidered.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  </Section>
                ) : null}
                {active.suggestedTests?.length ? (
                  <Section title="Suggested tests">
                    <ul className="space-y-2">
                      {active.suggestedTests.map((t, i) => (
                        <li key={`${t.name}-${i}`} className="rounded-lg bg-white px-2 py-1.5">
                          <p className="font-semibold text-ink">
                            {t.name}
                            {t.priority ? (
                              <span className="ml-2 text-[10px] font-bold uppercase text-amber-700">
                                {t.priority}
                              </span>
                            ) : null}
                          </p>
                          {t.reason ? <p className="text-ink-soft">{t.reason}</p> : null}
                        </li>
                      ))}
                    </ul>
                  </Section>
                ) : null}
                {active.suggestedMedicines?.length ? (
                  <Section title="Suggested medicines (review only)">
                    <ul className="space-y-2">
                      {active.suggestedMedicines.map((m, i) => (
                        <li key={`${m.name}-${i}`} className="rounded-lg bg-white px-2 py-1.5">
                          <p className="font-semibold text-ink">
                            {m.name}
                            {m.type ? (
                              <span className="ml-2 text-[10px] font-bold uppercase text-sage-deep">
                                {m.type}
                              </span>
                            ) : null}
                          </p>
                          {m.rationale ? <p className="text-ink-soft">{m.rationale}</p> : null}
                          {m.caution ? (
                            <p className="text-[11px] font-medium text-amber-800">Caution: {m.caution}</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </Section>
                ) : null}
                {active.redFlags?.length ? (
                  <Section title="Red flags">
                    <ul className="list-disc space-y-1 pl-4 text-amber-900">
                      {active.redFlags.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </Section>
                ) : null}
                {active.followUpAdvice ? (
                  <Section title="Follow-up">{active.followUpAdvice}</Section>
                ) : null}
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
                  {active.disclaimer ||
                    'AI assist only — doctor must review before any prescription or lab order.'}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{title}</p>
    <div className="mt-1 text-sm leading-relaxed text-ink-soft">{children}</div>
  </div>
);
