import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Apple,
  ClipboardList,
  Dumbbell,
  Droplets,
  HeartPulse,
  Lock,
  Ruler,
  Save,
  SquarePen,
  Stethoscope,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { GENERAL_EXAMINATION_OPTIONS } from '@/constants/patientGeneralExaminationOptions';
import type { MasterItem } from '@/types/api.types';
import type {
  ClinicalSectionKey,
  PatientClinicalProfile,
} from '@/types/patientClinical.types';
import { withComputedMeasurements } from '@/utils/patientClinicalHelpers';

type SectionDef = {
  id: ClinicalSectionKey;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const SECTIONS: SectionDef[] = [
  {
    id: 'presentComplaint',
    label: 'Complaint',
    title: 'Present complaint',
    description: 'Current symptoms or reason for visit',
    icon: ClipboardList,
  },
  {
    id: 'generalExamination',
    label: 'General',
    title: 'General examination',
    description: 'Nadi, Jivha, digestion, sleep, and Ayurvedic signs',
    icon: HeartPulse,
  },
  {
    id: 'diseaseHistory',
    label: 'Disease',
    title: 'Disease history',
    description: 'Past illnesses and conditions',
    icon: Stethoscope,
  },
  {
    id: 'diabetesHistory',
    label: 'Diabetes',
    title: 'Diabetes history',
    description: 'Type, insulin, and diabetes medications',
    icon: Droplets,
  },
  {
    id: 'metabolicDisorder',
    label: 'Metabolic',
    title: 'Metabolic disorders',
    description: 'BP, cholesterol, thyroid, PCOS, and related care',
    icon: Activity,
  },
  {
    id: 'eatingHabits',
    label: 'Diet',
    title: 'Eating habits',
    description: 'Food preference, schedule, likes and dislikes',
    icon: Apple,
  },
  {
    id: 'physicalActivity',
    label: 'Activity',
    title: 'Physical activity',
    description: 'Work pattern, walk, yoga, exercise, meditation',
    icon: Dumbbell,
  },
  {
    id: 'physicalMeasurement',
    label: 'Body',
    title: 'Body measurements',
    description: 'Height, weight, BMI and WHR',
    icon: Ruler,
  },
];

const GENERAL_FIELDS: { key: keyof PatientClinicalProfile['generalExamination']; label: string }[] =
  [
    { key: 'prakriti', label: 'Prakriti' },
    { key: 'nadi', label: 'Nadi (pulse)' },
    { key: 'jivha', label: 'Jivha (tongue)' },
    { key: 'stool', label: 'Stool' },
    { key: 'urine', label: 'Urine' },
    { key: 'hunger', label: 'Hunger' },
    { key: 'digestion', label: 'Digestion' },
    { key: 'sleep', label: 'Sleep' },
    { key: 'intolerance', label: 'Food intolerance' },
  ];

const DISEASE_FIELDS: { key: keyof PatientClinicalProfile['diseaseHistory']; label: string }[] = [
  { key: 'skin', label: 'Skin disorders' },
  { key: 'migrane', label: 'Migraine' },
  { key: 'chicken', label: 'Chicken pox' },
  { key: 'jaundice', label: 'Jaundice' },
  { key: 'bronchitis', label: 'Bronchitis' },
  { key: 'anorectal', label: 'Anorectal' },
  { key: 'amlaPitta', label: 'Amla pitta / acidity' },
  { key: 'menstrual', label: 'Menstrual' },
  { key: 'bowel', label: 'Bowel' },
  { key: 'addiction', label: 'Addiction' },
  { key: 'geneticDisorder', label: 'Genetic disorder' },
  { key: 'accidentalHistory', label: 'Accidental history' },
];

const METABOLIC_PAIRS: {
  label: string;
  medicine: keyof PatientClinicalProfile['metabolicDisorder'];
  duration: keyof PatientClinicalProfile['metabolicDisorder'];
}[] = [
  { label: 'Blood pressure', medicine: 'bpMedicine', duration: 'bpMedicineDurations' },
  {
    label: 'Cholesterol',
    medicine: 'cholesterolMedicine',
    duration: 'cholesterolMedicineDurations',
  },
  { label: 'Thyroid', medicine: 'thyroidMedicine', duration: 'thyroidMedicineDurations' },
  { label: 'PCOS', medicine: 'pcosMedicine', duration: 'pcosMedicineDurations' },
  {
    label: 'Retinopathy',
    medicine: 'retinopathyMedicine',
    duration: 'retinopathyMedicineDurations',
  },
  {
    label: 'Nephropathy',
    medicine: 'nephropathyMedicine',
    duration: 'nephropathyMedicineDurations',
  },
  {
    label: 'Neuropathy',
    medicine: 'neuropathyMedicine',
    duration: 'neuropathyMedicineDurations',
  },
  { label: 'Obesity', medicine: 'obesityMedicine', duration: 'obesityMedicineDurations' },
  {
    label: 'Lifestyle disorder',
    medicine: 'lifestyleMedicine',
    duration: 'lifestyleMedicineDurations',
  },
  { label: 'Other', medicine: 'otherMedicine', duration: 'otherMedicineDurations' },
];

interface Props {
  clinical: PatientClinicalProfile;
  prakritiMasters?: MasterItem[];
  loading?: boolean;
  saving?: boolean;
  editing?: boolean;
  onChange: (clinical: PatientClinicalProfile) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void | Promise<void>;
}

const Field = ({
  label,
  value,
  onChange,
  multiline,
  placeholder,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  readOnly?: boolean;
}) => {
  const locked = readOnly
    ? 'cursor-default border-border-sage/60 bg-cream/40 text-ink-soft'
    : 'border-border-sage/90 bg-white';
  return (
    <div className="group">
      <label className={`${formLabelClass} text-ink-soft`}>{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
          className={`${formInputClass} min-h-[80px] resize-y transition-shadow focus:shadow-sm ${locked}`}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          value={value}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
          className={`${formInputClass} transition-shadow focus:shadow-sm ${locked}`}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

const SelectField = ({
  label,
  value,
  options,
  onChange,
  readOnly,
  placeholder = 'Select',
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}) => {
  const optionList =
    value && !options.includes(value) ? [value, ...options] : options;
  const locked = readOnly
    ? 'cursor-default border-border-sage/60 bg-cream/40 text-ink-soft'
    : 'border-border-sage/90 bg-white';

  return (
    <div className="group">
      <label className={`${formLabelClass} text-ink-soft`}>{label}</label>
      <select
        value={value}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`${formSelectClass} transition-shadow focus:shadow-sm ${locked}`}
      >
        <option value="">{readOnly ? '—' : placeholder}</option>
        {optionList.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-sage/20 bg-gradient-to-br from-sage-mist/80 to-white px-4 py-3 shadow-sm">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
    <p className="mt-1 font-serif text-2xl font-semibold text-sage-deep">{value || '—'}</p>
  </div>
);

export const PatientClinicalInfoPanel = ({
  clinical,
  prakritiMasters = [],
  loading = false,
  saving = false,
  editing = false,
  onChange,
  onStartEdit,
  onCancelEdit,
  onSave,
}: Props) => {
  const readOnly = !editing;
  const [activeSection, setActiveSection] = useState<ClinicalSectionKey>('generalExamination');

  useEffect(() => {
    if (window.location.hash === '#patient-info') {
      setActiveSection('generalExamination');
    }
  }, [loading]);

  const patch = <K extends ClinicalSectionKey>(
    section: K,
    value: PatientClinicalProfile[K]
  ) => {
    onChange({ ...clinical, [section]: value });
  };

  const patchNested = <
    K extends ClinicalSectionKey,
    F extends keyof PatientClinicalProfile[K] & string,
  >(
    section: K,
    field: F,
    value: PatientClinicalProfile[K][F]
  ) => {
    onChange({
      ...clinical,
      [section]: { ...(clinical[section] as object), [field]: value },
    });
  };

  const onMeasurementChange = (
    field: keyof PatientClinicalProfile['physicalMeasurement'],
    value: string
  ) => {
    patch('physicalMeasurement', withComputedMeasurements({ ...clinical.physicalMeasurement, [field]: value }));
  };

  const activeMeta = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];

  const renderForm = () => {
    switch (activeSection) {
      case 'presentComplaint':
        return (
          <Field
            label="Chief complaint"
            value={clinical.presentComplaint.complaint}
            onChange={(v) => patchNested('presentComplaint', 'complaint', v)}
            multiline
            readOnly={readOnly}
            placeholder="Describe current complaints, duration, severity…"
          />
        );

      case 'generalExamination': {
        const prakritiOptions = prakritiMasters.map((m) => m.name);
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            {GENERAL_FIELDS.map((f) => {
              const value = clinical.generalExamination[f.key];
              const options =
                f.key === 'prakriti'
                  ? prakritiOptions
                  : GENERAL_EXAMINATION_OPTIONS[f.key];
              return (
                <SelectField
                  key={f.key}
                  label={f.label}
                  value={value}
                  options={[...options]}
                  onChange={(v) => patchNested('generalExamination', f.key, v)}
                  readOnly={readOnly}
                />
              );
            })}
          </div>
        );
      }

      case 'diseaseHistory':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            {DISEASE_FIELDS.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                value={clinical.diseaseHistory[f.key]}
                onChange={(v) => patchNested('diseaseHistory', f.key, v)}
                readOnly={readOnly}
                placeholder="Yes / No / details"
              />
            ))}
          </div>
        );

      case 'diabetesHistory':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Diabetes type"
              value={clinical.diabetesHistory.diabetesType}
              onChange={(v) => patchNested('diabetesHistory', 'diabetesType', v)}
              readOnly={readOnly}
            />
            <Field
              label="Type duration"
              value={clinical.diabetesHistory.typeDurations}
              onChange={(v) => patchNested('diabetesHistory', 'typeDurations', v)}
              readOnly={readOnly}
            />
            <Field
              label="Insulin"
              value={clinical.diabetesHistory.insulin}
              onChange={(v) => patchNested('diabetesHistory', 'insulin', v)}
              readOnly={readOnly}
            />
            <Field
              label="Insulin duration"
              value={clinical.diabetesHistory.insulinDurations}
              onChange={(v) => patchNested('diabetesHistory', 'insulinDurations', v)}
              readOnly={readOnly}
            />
            <div className="sm:col-span-2">
              <Field
                label="Current medicine"
                value={clinical.diabetesHistory.currentMedicine}
                onChange={(v) => patchNested('diabetesHistory', 'currentMedicine', v)}
                multiline
                readOnly={readOnly}
              />
            </div>
            <Field
              label="Current medicine duration"
              value={clinical.diabetesHistory.currentMedicineDurations}
              onChange={(v) => patchNested('diabetesHistory', 'currentMedicineDurations', v)}
              readOnly={readOnly}
            />
          </div>
        );

      case 'metabolicDisorder':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {METABOLIC_PAIRS.map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-border-sage/70 bg-white p-4 shadow-sm"
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">
                  {row.label}
                </p>
                <div className="grid gap-3">
                  <Field
                    label="Medicine"
                    value={clinical.metabolicDisorder[row.medicine]}
                    onChange={(v) => patchNested('metabolicDisorder', row.medicine, v)}
                    readOnly={readOnly}
                  />
                  <Field
                    label="Duration"
                    value={clinical.metabolicDisorder[row.duration]}
                    onChange={(v) => patchNested('metabolicDisorder', row.duration, v)}
                    readOnly={readOnly}
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 'eatingHabits':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Food preference"
              value={clinical.eatingHabits.preference}
              onChange={(v) => patchNested('eatingHabits', 'preference', v)}
              readOnly={readOnly}
            />
            <Field
              label="Meal quantity"
              value={clinical.eatingHabits.quantity}
              onChange={(v) => patchNested('eatingHabits', 'quantity', v)}
              readOnly={readOnly}
            />
            <div className="sm:col-span-2">
              <Field
                label="Meal schedule"
                value={clinical.eatingHabits.schedule}
                onChange={(v) => patchNested('eatingHabits', 'schedule', v)}
                multiline
                readOnly={readOnly}
              />
            </div>
            <Field
              label="Likes"
              value={clinical.eatingHabits.likes}
              onChange={(v) => patchNested('eatingHabits', 'likes', v)}
              multiline
              readOnly={readOnly}
            />
            <Field
              label="Dislikes"
              value={clinical.eatingHabits.dislikes}
              onChange={(v) => patchNested('eatingHabits', 'dislikes', v)}
              multiline
              readOnly={readOnly}
            />
          </div>
        );

      case 'physicalActivity':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={`${formLabelClass} text-ink-soft`}>Physically active?</label>
              <select
                value={
                  clinical.physicalActivity.active === null
                    ? ''
                    : clinical.physicalActivity.active
                      ? 'yes'
                      : 'no'
                }
                disabled={readOnly}
                onChange={(e) => {
                  const v = e.target.value;
                  patchNested('physicalActivity', 'active', v === '' ? null : v === 'yes');
                }}
                className={`${formInputClass} border-border-sage/90 bg-white`}
              >
                <option value="">Not set</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <Field
              label="Work pattern"
              value={clinical.physicalActivity.workPattern}
              onChange={(v) => patchNested('physicalActivity', 'workPattern', v)}
              readOnly={readOnly}
            />
            <Field
              label="Walk"
              value={clinical.physicalActivity.walk}
              onChange={(v) => patchNested('physicalActivity', 'walk', v)}
              readOnly={readOnly}
            />
            <Field
              label="Yoga"
              value={clinical.physicalActivity.yoga}
              onChange={(v) => patchNested('physicalActivity', 'yoga', v)}
              readOnly={readOnly}
            />
            <Field
              label="Exercise"
              value={clinical.physicalActivity.exercise}
              onChange={(v) => patchNested('physicalActivity', 'exercise', v)}
              readOnly={readOnly}
            />
            <Field
              label="Meditation"
              value={clinical.physicalActivity.meditative}
              onChange={(v) => patchNested('physicalActivity', 'meditative', v)}
              readOnly={readOnly}
            />
          </div>
        );

      case 'physicalMeasurement':
        return (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="BMI" value={clinical.physicalMeasurement.bmi} />
              <StatCard label="WHR" value={clinical.physicalMeasurement.whr} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Height (cm)"
                value={clinical.physicalMeasurement.height}
                onChange={(v) => onMeasurementChange('height', v)}
                readOnly={readOnly}
              />
              <Field
                label="Weight (kg)"
                value={clinical.physicalMeasurement.weight}
                onChange={(v) => onMeasurementChange('weight', v)}
                readOnly={readOnly}
              />
              <Field
                label="Bicep (cm)"
                value={clinical.physicalMeasurement.bicep}
                onChange={(v) => onMeasurementChange('bicep', v)}
                readOnly={readOnly}
              />
              <Field
                label="Waist (cm)"
                value={clinical.physicalMeasurement.waist}
                onChange={(v) => onMeasurementChange('waist', v)}
                readOnly={readOnly}
              />
              <Field
                label="Hip (cm)"
                value={clinical.physicalMeasurement.hip}
                onChange={(v) => onMeasurementChange('hip', v)}
                readOnly={readOnly}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-cream/30">
        <p className="text-sm text-ink-soft">Loading clinical assessment…</p>
      </div>
    );
  }

  return (
    <div id="patient-info" className="scroll-mt-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sage-mist px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sage-deep">
          <Lock className="h-3 w-3" strokeWidth={2.25} />
          Admin only · not on patient portal
        </span>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {editing ? (
            <>
              <Button
                variant="secondary"
                className="gap-1.5 rounded-xl"
                onClick={onCancelEdit}
                disabled={saving}
              >
                <X className="h-4 w-4" strokeWidth={2} />
                Cancel
              </Button>
              <Button
                className="gap-2 rounded-xl"
                onClick={() => void onSave()}
                isLoading={saving}
              >
                <Save className="h-4 w-4" strokeWidth={2} />
                Save patient info
              </Button>
            </>
          ) : (
            <Button className="gap-2 rounded-xl" onClick={onStartEdit}>
              <SquarePen className="h-4 w-4" strokeWidth={2} />
              Edit info
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-sage/80 bg-sage-mist/30 p-1">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-0.5">
          {SECTIONS.map((tab) => {
            const active = activeSection === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-white text-sage-deep shadow-sm ring-1 ring-border-sage/80'
                    : 'text-ink-soft hover:bg-white/60 hover:text-ink'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex max-h-[min(520px,62vh)] flex-col overflow-hidden rounded-2xl border border-border-sage/80 bg-gradient-to-b from-cream/50 to-white">
        <div className="shrink-0 border-b border-border-sage/60 px-4 pb-3 pt-4 sm:px-5">
          <h3 className="font-serif text-base font-semibold text-ink">{activeMeta.title}</h3>
          <p className="mt-0.5 text-xs text-ink-ghost">{activeMeta.description}</p>
        </div>

        <div
          key={activeSection}
          className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5"
        >
          {renderForm()}
        </div>
      </div>

      {clinical.updatedAt ? (
        <p className="mt-3 text-right text-[11px] text-ink-ghost">
          Last saved {new Date(clinical.updatedAt).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
};
