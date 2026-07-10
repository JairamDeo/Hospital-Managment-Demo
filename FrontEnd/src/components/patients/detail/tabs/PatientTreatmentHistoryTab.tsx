import { useState } from 'react';
import type {
  IpdDailyTreatmentRecord,
  IpdTreatmentHistoryItem,
  OpdTreatmentHistoryItem,
  PatientTreatmentHistory,
} from '@/types/patientDetail.types';

type HistoryMode = 'opd' | 'ipd';

interface Props {
  history: PatientTreatmentHistory | null;
  loading: boolean;
}

const MODE_TABS: { id: HistoryMode; label: string }[] = [
  { id: 'opd', label: 'OPD' },
  { id: 'ipd', label: 'IPD' },
];

const emptyText = (value: string) => value?.trim() || '—';

const OpdRecord = ({ item }: { item: OpdTreatmentHistoryItem }) => (
  <article className="rounded-xl border border-border-sage bg-cream/20 p-4 sm:p-5">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h4 className="font-serif text-base font-semibold text-ink">{item.title}</h4>
        <p className="mt-1 text-xs text-ink-soft">{item.doctor}</p>
      </div>
      <span className="shrink-0 text-xs font-medium text-ink-ghost">{item.date}</span>
    </div>
    <dl className="mt-4 space-y-3 text-sm">
      <div>
        <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Diagnosis</dt>
        <dd className="mt-1 leading-relaxed text-ink-soft">{emptyText(item.diagnosis)}</dd>
      </div>
      <div>
        <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Remarks</dt>
        <dd className="mt-1 leading-relaxed text-ink-soft">{emptyText(item.remarks)}</dd>
      </div>
    </dl>
  </article>
);

const IpdDailyRecordsTable = ({ records }: { records: IpdDailyTreatmentRecord[] }) => (
  <div className="overflow-x-auto rounded-lg border border-border-sage">
    <table className="w-full min-w-[760px] text-left text-sm">
      <thead>
        <tr className="border-b border-border-sage bg-cream/50 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
          <th className="whitespace-nowrap px-3 py-2">Day</th>
          <th className="whitespace-nowrap px-3 py-2">Date</th>
          <th className="whitespace-nowrap px-3 py-2">BP</th>
          <th className="whitespace-nowrap px-3 py-2">Pulse</th>
          <th className="whitespace-nowrap px-3 py-2">SpO₂</th>
          <th className="min-w-[140px] px-3 py-2">Treatment</th>
          <th className="min-w-[120px] px-3 py-2">Medicines</th>
          <th className="min-w-[120px] px-3 py-2">Observations</th>
          <th className="whitespace-nowrap px-3 py-2">By</th>
        </tr>
      </thead>
      <tbody>
        {records.map((day) => (
          <tr key={day.id} className="border-b border-border-sage/60 align-top last:border-0">
            <td className="whitespace-nowrap px-3 py-2 font-semibold text-sage-deep">{day.dayLabel}</td>
            <td className="whitespace-nowrap px-3 py-2 text-ink-soft">{day.date}</td>
            <td className="whitespace-nowrap px-3 py-2 font-medium text-ink">{emptyText(day.bp)}</td>
            <td className="whitespace-nowrap px-3 py-2">{emptyText(day.pulse)}</td>
            <td className="whitespace-nowrap px-3 py-2">{emptyText(day.spo2)}</td>
            <td className="px-3 py-2 text-ink-soft">{emptyText(day.treatmentGiven)}</td>
            <td className="px-3 py-2 text-ink-soft">{emptyText(day.medicines)}</td>
            <td className="px-3 py-2 text-ink-soft">{emptyText(day.observations)}</td>
            <td className="whitespace-nowrap px-3 py-2 text-xs text-ink-ghost">
              {emptyText(day.recordedByName)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const IpdAdmissionCard = ({ admission }: { admission: IpdTreatmentHistoryItem }) => (
  <article className="overflow-hidden rounded-xl border border-border-sage bg-white">
    <header className="border-b border-border-sage bg-cream/40 px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="font-serif text-base font-semibold text-ink">
            Admission · {admission.admissionCode}
          </h4>
          <p className="mt-1 text-xs text-ink-soft">
            {admission.doctorName}
            {admission.roomName ? ` · ${admission.roomName}` : ''}
            {admission.roomNumber ? ` (${admission.roomNumber})` : ''}
          </p>
        </div>
        <div className="text-xs text-ink-ghost">
          <p>
            Admitted: <span className="font-medium text-ink-soft">{admission.admittedAtLabel}</span>
          </p>
          {admission.dischargedAtLabel ? (
            <p>
              Discharged:{' '}
              <span className="font-medium text-ink-soft">{admission.dischargedAtLabel}</span>
            </p>
          ) : null}
        </div>
      </div>
      {admission.chiefComplaint || admission.diagnosis ? (
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {admission.chiefComplaint ? (
            <p>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                Chief complaint
              </span>
              <span className="mt-0.5 block text-ink-soft">{admission.chiefComplaint}</span>
            </p>
          ) : null}
          {admission.diagnosis ? (
            <p>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                Diagnosis
              </span>
              <span className="mt-0.5 block text-ink-soft">{admission.diagnosis}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </header>

    <div className="px-4 py-4 sm:px-5">
      {admission.dailyRecords.length === 0 ? (
        <p className="py-4 text-sm text-ink-soft">No day-wise treatment notes recorded.</p>
      ) : (
        <IpdDailyRecordsTable records={admission.dailyRecords} />
      )}
    </div>
  </article>
);

export const PatientTreatmentHistoryTab = ({ history, loading }: Props) => {
  const [mode, setMode] = useState<HistoryMode>('opd');

  if (loading) {
    return <p className="py-10 text-center text-sm text-ink-soft">Loading treatment history…</p>;
  }

  if (!history) {
    return (
      <p className="py-10 text-center text-sm text-ink-soft">Treatment history unavailable.</p>
    );
  }

  const items = mode === 'opd' ? history.opd : history.ipd;

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl bg-sage-mist/40 p-1">
        {MODE_TABS.map((tab) => {
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                active
                  ? 'bg-white text-sage-deep shadow-sm ring-1 ring-border-sage/80'
                  : 'text-ink-soft hover:bg-white/70 hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-soft">
          {mode === 'opd'
            ? 'No OPD consultations recorded yet.'
            : 'No IPD admissions recorded yet.'}
        </p>
      ) : mode === 'opd' ? (
        <div className="space-y-3">
          {(history.opd as OpdTreatmentHistoryItem[]).map((item) => (
            <OpdRecord key={item.appointmentCode} item={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {(history.ipd as IpdTreatmentHistoryItem[]).map((admission) => (
            <IpdAdmissionCard key={admission.admissionCode} admission={admission} />
          ))}
        </div>
      )}
    </div>
  );
};
