import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Clock3, Languages, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formLabelClass, formSelectClass, formInputClass } from '@/components/ui/formStyles';
import { useToast } from '@/hooks/useToast';
import {
  patientAdminService,
  type AiConsultationLocalized,
  type AiConsultationSample,
  type AiConsultationSummary,
} from '@/services/patient/patientAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';

type OutputLang = 'en' | 'hi' | 'both';
type ViewLang = 'en' | 'hi';

interface Props {
  open: boolean;
  onClose: () => void;
  patientCode: string;
  patientName?: string;
}

const resolveViewContent = (
  summary: AiConsultationSummary,
  viewLang: ViewLang
): AiConsultationLocalized => {
  if (viewLang === 'hi' && summary.contentHi) return summary.contentHi;
  if (summary.contentEn) return summary.contentEn;
  return {
    clinicalSummary: summary.clinicalSummary,
    chiefComplaint: summary.chiefComplaint,
    assessment: summary.assessment,
    historyConsidered: summary.historyConsidered,
    suggestedTests: summary.suggestedTests,
    suggestedMedicines: summary.suggestedMedicines,
    redFlags: summary.redFlags,
    followUpAdvice: summary.followUpAdvice,
    disclaimer: summary.disclaimer,
  };
};

export const AiConsultationModal = ({ open, onClose, patientCode, patientName }: Props) => {
  const { showToast } = useToast();
  const [samples, setSamples] = useState<AiConsultationSample[]>([]);
  const [sampleId, setSampleId] = useState('');
  const [discussionText, setDiscussionText] = useState('');
  const [outputLanguage, setOutputLanguage] = useState<OutputLang>('both');
  const [viewLang, setViewLang] = useState<ViewLang>('en');
  const [summaries, setSummaries] = useState<AiConsultationSummary[]>([]);
  const [active, setActive] = useState<AiConsultationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [translatingHi, setTranslatingHi] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [samplesRes, listRes] = await Promise.all([
        patientAdminService.listAiConsultationSamples(),
        patientAdminService.listAiConsultationSummaries(patientCode),
      ]);
      const sampleRows = samplesRes.data.res?.samples ?? [];
      const list = listRes.data.res?.summaries ?? [];
      setSamples(sampleRows);
      setSummaries(list);
      if (sampleRows[0]) {
        setSampleId((prev) => prev || sampleRows[0].id);
        setDiscussionText((prev) => prev || sampleRows[0].discussionText);
      }
      if (list[0]) {
        setActive((prev) => prev ?? list[0]);
        if (list[0].hasHindi) setViewLang('en');
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [patientCode, showToast]);

  useEffect(() => {
    if (!open) return;
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
        language: outputLanguage,
      });
      const summary = data.res?.summary;
      if (summary) {
        setActive(summary);
        setSummaries((prev) => [summary, ...prev.filter((s) => s.summaryCode !== summary.summaryCode)]);
        if (outputLanguage === 'hi' && summary.hasHindi) setViewLang('hi');
        else setViewLang('en');
        if (!summary.hasHindi) {
          showToast(
            'Summary ready in English. Click हिंदी to translate (may take a moment).',
            'success'
          );
        } else {
          showToast(
            outputLanguage === 'hi'
              ? 'सारांश तैयार — प्रिस्क्रिप्शन से पहले समीक्षा करें'
              : 'AI summary generated — review before prescribing',
            'success'
          );
        }
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setGenerating(false);
    }
  };

  const openHindiView = async () => {
    if (!active) return;
    if (active.hasHindi && active.contentHi) {
      setViewLang('hi');
      return;
    }
    setTranslatingHi(true);
    try {
      const { data } = await patientAdminService.ensureAiConsultationHindi(
        patientCode,
        active.summaryCode
      );
      const summary = data.res?.summary;
      if (summary?.hasHindi) {
        setActive(summary);
        setSummaries((prev) =>
          prev.map((s) => (s.summaryCode === summary.summaryCode ? summary : s))
        );
        setViewLang('hi');
      } else {
        showToast('Hindi translation not available', 'error');
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setTranslatingHi(false);
    }
  };

  const viewContent = useMemo(
    () => (active ? resolveViewContent(active, viewLang) : null),
    [active, viewLang]
  );

  const labels =
    viewLang === 'hi'
      ? {
          clinical: 'क्लिनिकल सारांश',
          assessment: 'आकलन',
          history: 'विचारित इतिहास',
          tests: 'सुझाए गए टेस्ट',
          medicines: 'सुझाई दवाएँ (केवल समीक्षा)',
          flags: 'चेतावनी / रेड फ्लैग',
          followUp: 'फॉलो-अप सलाह',
          empty: 'सारांश देखने के लिए जनरेट करें या पिछला चुनें।',
          previous: 'पिछले AI सारांश',
        }
      : {
          clinical: 'Clinical summary',
          assessment: 'Assessment',
          history: 'History considered',
          tests: 'Suggested tests',
          medicines: 'Suggested medicines (review only)',
          flags: 'Red flags',
          followUp: 'Follow-up advice',
          empty: 'Generate a summary or open a previous one to view results.',
          previous: 'Previous AI summaries',
        };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="AI consultation summary"
      subtitle={
        patientName
          ? `${patientName} · discussion + patient profile (labs, Rx, vitals) · EN / हिंदी`
          : 'Discussion + patient profile · English / हिंदी'
      }
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => void handleGenerate()} disabled={generating || loading}>
            {generating
              ? outputLanguage === 'hi'
                ? 'जनरेट हो रहा है…'
                : 'Generating…'
              : outputLanguage === 'hi'
                ? 'सारांश जनरेट करें'
                : 'Generate summary'}
          </Button>
        </>
      }
    >
      {loading ? (
        <p className="py-8 text-center text-sm text-ink-soft">Loading…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
          {/* Left: inputs + history */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border-sage/80 bg-cream/40 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Languages className="h-4 w-4 text-sage-deep" />
                <p className="text-sm font-semibold text-ink">Output language</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'en', label: 'English' },
                    { id: 'hi', label: 'हिंदी' },
                    { id: 'both', label: 'Both / दोनों' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setOutputLanguage(opt.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      outputLanguage === opt.id
                        ? 'bg-sage-deep text-white shadow-sm'
                        : 'border border-border-sage bg-white text-ink-soft hover:bg-sage-mist/70'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-ghost">
                Hindi is created with a Node translate library after the English medical draft.
                Discussion text can be English, Hindi, or mixed.
              </p>
            </div>

            <label className="block">
              <span className={formLabelClass}>Sample discussion</span>
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
              <span className={formLabelClass}>Discussion (edit / paste · EN or हिंदी)</span>
              <textarea
                className={`${formInputClass} min-h-[180px] resize-y text-[13px] leading-relaxed`}
                value={discussionText}
                onChange={(e) => setDiscussionText(e.target.value)}
                placeholder="Doctor: … Patient: … / डॉक्टर: … मरीज: …"
              />
            </label>

            <div className="rounded-2xl border border-border-sage bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-sage-deep" />
                <p className="text-sm font-semibold text-ink">
                  {labels.previous}
                  <span className="ml-1.5 text-xs font-medium text-ink-ghost">
                    ({summaries.length})
                  </span>
                </p>
              </div>
              {summaries.length === 0 ? (
                <p className="rounded-xl bg-cream/60 px-3 py-4 text-center text-xs text-ink-ghost">
                  No previous summaries yet for this patient.
                </p>
              ) : (
                <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
                  {summaries.map((s) => {
                    const selected = active?.summaryCode === s.summaryCode;
                    return (
                      <li key={s.summaryCode}>
                        <button
                          type="button"
                          onClick={() => {
                            setActive(s);
                            if (s.hasHindi && viewLang === 'hi') setViewLang('hi');
                            else setViewLang('en');
                          }}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                            selected
                              ? 'border-sage-light bg-sage-mist/50 ring-1 ring-sage-pale'
                              : 'border-border-sage/70 bg-cream/30 hover:bg-sage-mist/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-ink">
                              {s.chiefComplaint || s.contentEn?.chiefComplaint || 'Summary'}
                            </p>
                            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sage-deep ring-1 ring-border-sage">
                              {s.hasHindi ? 'EN+HI' : 'EN'}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-ink-soft">
                            {s.clinicalSummary || s.contentEn?.clinicalSummary || '—'}
                          </p>
                          <p className="mt-1.5 text-[11px] text-ink-ghost">
                            {s.summaryCode}
                            {s.createdAt
                              ? ` · ${new Date(s.createdAt).toLocaleString('en-IN')}`
                              : ''}
                            {s.model ? ` · ${s.model}` : ''}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Right: active summary */}
          <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border-sage bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-sage/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sage-deep" />
                <p className="text-sm font-semibold text-ink">Generated summary</p>
              </div>
              {active ? (
                <div className="flex items-center gap-1 rounded-full border border-border-sage bg-cream/50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewLang('en')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      viewLang === 'en' ? 'bg-sage-deep text-white' : 'text-ink-soft'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    disabled={translatingHi}
                    onClick={() => void openHindiView()}
                    className={`rounded-full px-3 py-1 text-xs font-semibold disabled:cursor-wait disabled:opacity-70 ${
                      viewLang === 'hi' ? 'bg-sage-deep text-white' : 'text-ink-soft'
                    }`}
                  >
                    {translatingHi ? '…' : 'हिंदी'}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {!active || !viewContent ? (
                <p className="py-16 text-center text-sm text-ink-ghost">{labels.empty}</p>
              ) : (
                <>
                  <div>
                    <p className="font-serif text-lg font-semibold text-ink">
                      {viewContent.chiefComplaint || 'Summary'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-ghost">
                      {active.summaryCode}
                      {active.model ? ` · ${active.model}` : ''}
                      {active.tokenUsage?.totalTokens
                        ? ` · ${active.tokenUsage.totalTokens} tokens`
                        : ''}
                    </p>
                  </div>

                  <Section title={labels.clinical}>{viewContent.clinicalSummary}</Section>
                  <Section title={labels.assessment}>{viewContent.assessment}</Section>

                  {viewContent.historyConsidered?.length ? (
                    <Section title={labels.history}>
                      <ul className="list-disc space-y-1 pl-4">
                        {viewContent.historyConsidered.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    </Section>
                  ) : null}

                  {viewContent.suggestedTests?.length ? (
                    <Section title={labels.tests}>
                      <ul className="space-y-2">
                        {viewContent.suggestedTests.map((t, i) => (
                          <li
                            key={`${t.name}-${i}`}
                            className="rounded-xl border border-border-sage/60 bg-cream/40 px-3 py-2"
                          >
                            <p className="font-semibold text-ink">
                              {t.name}
                              {t.priority ? (
                                <span className="ml-2 text-[10px] font-bold uppercase text-amber-700">
                                  {t.priority}
                                </span>
                              ) : null}
                            </p>
                            {t.reason ? <p className="mt-0.5 text-ink-soft">{t.reason}</p> : null}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  ) : null}

                  {viewContent.suggestedMedicines?.length ? (
                    <Section title={labels.medicines}>
                      <ul className="space-y-2">
                        {viewContent.suggestedMedicines.map((m, i) => (
                          <li
                            key={`${m.name}-${i}`}
                            className="rounded-xl border border-border-sage/60 bg-cream/40 px-3 py-2"
                          >
                            <p className="font-semibold text-ink">
                              {m.name}
                              {m.type ? (
                                <span className="ml-2 text-[10px] font-bold uppercase text-sage-deep">
                                  {m.type}
                                </span>
                              ) : null}
                            </p>
                            {m.rationale ? (
                              <p className="mt-0.5 text-ink-soft">{m.rationale}</p>
                            ) : null}
                            {m.caution ? (
                              <p className="mt-1 text-[11px] font-medium text-amber-800">
                                {viewLang === 'hi' ? 'सावधानी' : 'Caution'}: {m.caution}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  ) : null}

                  {viewContent.redFlags?.length ? (
                    <Section title={labels.flags}>
                      <ul className="list-disc space-y-1 pl-4 text-amber-900">
                        {viewContent.redFlags.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </Section>
                  ) : null}

                  {viewContent.followUpAdvice ? (
                    <Section title={labels.followUp}>{viewContent.followUpAdvice}</Section>
                  ) : null}

                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
                    {viewContent.disclaimer ||
                      (viewLang === 'hi'
                        ? 'यह केवल AI सहायता है — प्रिस्क्रिप्शन या लैब ऑर्डर से पहले डॉक्टर समीक्षा करें।'
                        : 'AI assist only — doctor must review before any prescription or lab order.')}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-xl border border-border-sage/50 bg-cream/20 px-3 py-2.5">
    <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-ink-ghost">{title}</p>
    <div className="mt-1.5 text-sm leading-relaxed text-ink-soft">{children}</div>
  </div>
);
