import { Plus, SquarePen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  formInputClass,
  formLabelClass,
  formSelectClass,
  formTextareaClass,
} from '@/components/ui/formStyles';
import type {
  AppointmentClinicalNote,
  AppointmentDetail,
  AppointmentVitals,
} from '@/types/appointmentDetail.types';
import type { AppointmentDoctor } from '@/types/appointment.types';

export type VisitClinicalForm = {
  chiefComplaint: string;
  symptoms: string;
  diagnosis: string;
  staffCode: string;
  visitVitals: {
    temp: string;
    bp: string;
    pulse: string;
    spo2: string;
    weight: string;
  };
};

interface OverviewProps {
  appointment: AppointmentDetail;
  form: VisitClinicalForm;
  doctors: AppointmentDoctor[];
  canEdit: boolean;
  canChangeDoctor?: boolean;
  errors?: { chiefComplaint?: string };
  onChange: (patch: Partial<VisitClinicalForm>) => void;
}

export const AppointmentOverviewTab = ({
  appointment,
  form,
  doctors,
  canEdit,
  canChangeDoctor = true,
  errors,
  onChange,
}: OverviewProps) => (
  <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
      {appointment.clinicalNotes.map((note) => (
        <ClinicalNoteCell key={note.label} note={note} />
      ))}
    </div>

    <div className="grid gap-3 lg:grid-cols-2">
      <section>
        <label className={formLabelClass}>
          Chief complaint <span className="text-danger">*</span>
        </label>
        {canEdit ? (
          <>
            <textarea
              rows={2}
              value={form.chiefComplaint}
              onChange={(e) => onChange({ chiefComplaint: e.target.value })}
              placeholder="Main reason for today’s visit"
              className={`${formTextareaClass} min-h-[72px] ${errors?.chiefComplaint ? 'border-danger' : ''}`}
            />
            {errors?.chiefComplaint ? (
              <p className="mt-1 text-xs text-danger">{errors.chiefComplaint}</p>
            ) : null}
          </>
        ) : (
          <p className="rounded-xl border border-border-sage bg-cream/30 px-3 py-2 text-sm leading-relaxed text-ink">
            {form.chiefComplaint || '—'}
          </p>
        )}
      </section>

      <section>
        <label className={formLabelClass}>Symptoms</label>
        {canEdit ? (
          <textarea
            rows={2}
            value={form.symptoms}
            onChange={(e) => onChange({ symptoms: e.target.value })}
            placeholder="Symptoms (comma or new line)"
            className={`${formTextareaClass} min-h-[72px]`}
          />
        ) : form.symptoms.trim() ? (
          <div className="flex flex-wrap gap-1.5">
            {form.symptoms
              .split(/[,;\n]+/)
              .map((s) => s.trim())
              .filter(Boolean)
              .map((symptom) => (
                <span
                  key={symptom}
                  className="rounded-full border border-sage-pale bg-sage-mist/50 px-2.5 py-0.5 text-xs font-medium text-sage-deep"
                >
                  {symptom}
                </span>
              ))}
          </div>
        ) : (
          <p className="rounded-xl border border-border-sage bg-cream/30 px-3 py-2 text-sm text-ink-soft">
            No symptoms recorded
          </p>
        )}
      </section>

      <section>
        <label className={formLabelClass}>Diagnosis</label>
        {canEdit ? (
          <textarea
            rows={2}
            value={form.diagnosis}
            onChange={(e) => onChange({ diagnosis: e.target.value })}
            placeholder="Clinical diagnosis"
            className={`${formTextareaClass} min-h-[72px]`}
          />
        ) : (
          <p className="rounded-xl border border-border-sage bg-cream/30 px-3 py-2 text-sm text-ink">
            {form.diagnosis || '—'}
          </p>
        )}
      </section>

      <section>
        <label className={formLabelClass}>Doctor</label>
        {canEdit && canChangeDoctor ? (
          <select
            value={form.staffCode}
            onChange={(e) => onChange({ staffCode: e.target.value })}
            className={formSelectClass}
          >
            {!doctors.some((d) => d.staffCode === form.staffCode) && form.staffCode ? (
              <option value={form.staffCode}>{appointment.doctor}</option>
            ) : null}
            {doctors.map((d) => (
              <option key={d.staffCode} value={d.staffCode}>
                {d.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="rounded-xl border border-border-sage bg-cream/30 px-3 py-2 text-sm font-medium text-ink">
            {doctors.find((d) => d.staffCode === form.staffCode)?.name || appointment.doctor}
          </p>
        )}
      </section>
    </div>
  </div>
);

const ClinicalNoteCell = ({ note }: { note: AppointmentClinicalNote }) => (
  <div className="rounded-lg border border-border-sage/80 bg-cream/40 px-3 py-2">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{note.label}</p>
    <p className="mt-0.5 truncate text-sm font-medium text-ink">{note.value}</p>
  </div>
);

interface VitalsProps {
  vitals?: AppointmentVitals;
  formVitals: VisitClinicalForm['visitVitals'];
  canEdit: boolean;
  editing: boolean;
  onStartEdit: () => void;
  onChangeVitals: (patch: Partial<VisitClinicalForm['visitVitals']>) => void;
}

export const AppointmentVitalsTab = ({
  vitals,
  formVitals,
  canEdit,
  editing,
  onStartEdit,
  onChangeVitals,
}: VitalsProps) => {
  if (!editing) {
    if (!vitals) {
      return (
        <div className="py-6 text-center">
          <p className="text-sm text-ink-soft">No vitals recorded for this visit yet</p>
          {canEdit ? (
            <Button className="mt-3 gap-2 rounded-xl" onClick={onStartEdit}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add vitals
            </Button>
          ) : null}
        </div>
      );
    }

    const items = [
      { label: 'Temperature', value: vitals.temp },
      { label: 'Blood Pressure', value: vitals.bp },
      { label: 'Pulse', value: vitals.pulse },
      { label: 'SpO₂', value: vitals.spo2 },
      ...(vitals.weight ? [{ label: 'Weight', value: vitals.weight }] : []),
    ];

    return (
      <div className="space-y-3">
        {canEdit ? (
          <div className="flex justify-end">
            <Button variant="secondary" className="gap-1.5 rounded-xl" onClick={onStartEdit}>
              <SquarePen className="h-4 w-4" strokeWidth={2} />
              Edit vitals
            </Button>
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border-sage bg-gradient-to-br from-sage-mist/40 to-white px-4 py-3"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                {item.label}
              </p>
              <p className="mt-1 font-serif text-xl font-semibold text-sage-deep">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {(
        [
          ['temp', 'Temperature (°F)', '98.6'],
          ['bp', 'Blood pressure', '120/80'],
          ['pulse', 'Pulse (bpm)', '72'],
          ['spo2', 'SpO₂ (%)', '98'],
          ['weight', 'Weight (kg)', '68'],
        ] as const
      ).map(([key, label, placeholder]) => (
        <label key={key}>
          <span className={formLabelClass}>{label}</span>
          <input
            type="text"
            value={formVitals[key]}
            onChange={(e) => onChangeVitals({ [key]: e.target.value })}
            placeholder={placeholder}
            className={formInputClass}
          />
        </label>
      ))}
    </div>
  );
};
