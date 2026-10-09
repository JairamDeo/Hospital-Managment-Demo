import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Apple,
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
import { ContentLoader } from '@/components/ui/Loader';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { GENERAL_EXAMINATION_OPTIONS } from '@/constants/patientGeneralExaminationOptions';
import type { MasterItem } from '@/types/api.types';
import type {
  ClinicalSectionKey,
  PatientClinicalProfile,
} from '@/types/patientClinical.types';
import {
  cmToInches,
  getBmiCategory,
  inchesToCm,
  withComputedMeasurements,
} from '@/utils/patientClinicalHelpers';

type SectionDef = {
  id: ClinicalSectionKey;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const SECTIONS: SectionDef[] = [
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
    description: 'Food preference, meal quantity, meal times, likes and dislikes',
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

const DIABETES_TYPE_OPTIONS = [
  'Type 1',
  'Type 2',
  'Gestational',
  'Prediabetes',
  'LADA',
  'MODY',
  'Other',
  'None',
];

const DURATION_OPTIONS = [
  'Less than a month',
  '1 month',
  '2 months',
  '6 months',
  'More than 1 year',
  'More than 2 years',
];

const FOOD_PREFERENCE_OPTIONS = [
  'Vegetarian',
  'Non-vegetarian',
  'Eggetarian',
  'Vegan',
  'Jain',
  'Mixed',
];

const MEAL_QUANTITY_OPTIONS = [
  'Light — small portions',
  'Moderate — normal portions',
  'Heavy — large portions',
  'Variable — changes day to day',
];

const MEAL_TIMES_OPTIONS = [
  '1 time',
  '2 times',
  '3 times',
  '4 times',
  '5 times',
  'More than 5 times',
];

const WORK_PATTERN_OPTIONS = [
  'Office / desk job',
  'Field work',
  'Hybrid (office + field)',
  'Work from home',
  'Standing / shop / retail',
  'Manual labour',
  'Driving / travel heavy',
  'Student',
  'Homemaker',
  'Retired / not working',
];

const YES_NO_OPTIONS = ['Yes', 'No'];

const METABOLIC_PAIRS: {
  label: string;
  medicine: keyof PatientClinicalProfile['metabolicDisorder'];
  duration: keyof PatientClinicalProfile['metabolicDisorder'];
  /** Hide for these genders (e.g. PCOS / thyroid for male patients) */
  hideForGenders?: string[];
}[] = [
  { label: 'Blood pressure', medicine: 'bpMedicine', duration: 'bpMedicineDurations' },
  {
    label: 'Cholesterol',
    medicine: 'cholesterolMedicine',
    duration: 'cholesterolMedicineDurations',
  },
  {
    label: 'Thyroid',
    medicine: 'thyroidMedicine',
    duration: 'thyroidMedicineDurations',
    hideForGenders: ['Male'],
  },
  {
    label: 'PCOS',
    medicine: 'pcosMedicine',
    duration: 'pcosMedicineDurations',
    hideForGenders: ['Male'],
  },
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

const LabelText = ({ label, required }: { label: string; required?: boolean }) => {
  if (!label && !required) return null;
  return (
    <label className={`${formLabelClass} text-ink-soft`}>
      {label}
      {required ? <span className="ml-0.5 text-red-500">*</span> : null}
    </label>
  );
};

interface Props {
  clinical: PatientClinicalProfile;
  patientGender?: string;
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
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
}) => {
  const locked = readOnly
    ? 'cursor-default border-border-sage/60 bg-cream/40 text-ink-soft'
    : 'border-border-sage/90 bg-white';
  return (
    <div className="group">
      <LabelText label={label} required={required} />
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
  placeholder = 'Choose...',
  required,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  required?: boolean;
}) => {
  const optionList =
    value && !options.includes(value) ? [value, ...options] : options;
  const locked = readOnly
    ? 'cursor-default border-border-sage/60 bg-cream/40 text-ink-soft'
    : 'border-border-sage/90 bg-white';

  return (
    <div className="group">
      <LabelText label={label} required={required} />
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

const YesNoToggle = ({
  value,
  disabled,
  onChange,
}: {
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) => (
  <div className="inline-flex rounded-lg border border-border-sage/80 bg-cream/40 p-0.5">
    {([true, false] as const).map((opt) => {
      const active = value === opt;
      return (
        <button
          key={String(opt)}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt)}
          className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
            active
              ? 'bg-sage-mist text-sage-deep ring-1 ring-border-sage/70'
              : 'text-ink-soft hover:text-ink'
          } ${disabled ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
        >
          {opt ? 'Yes' : 'No'}
        </button>
      );
    })}
  </div>
);

/** Length input with per-field cm/in toggle. Value is always stored in cm. */
const LengthField = ({
  label,
  valueCm,
  onChangeCm,
  readOnly,
  syncKey,
  placeholderCm = 'e.g. 170',
  placeholderIn = 'e.g. 67',
}: {
  label: string;
  valueCm: string;
  onChangeCm: (cm: string) => void;
  readOnly?: boolean;
  /** Re-sync display when clinical data reloads */
  syncKey?: string | null;
  placeholderCm?: string;
  placeholderIn?: string;
}) => {
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');
  const [input, setInput] = useState(valueCm);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused) return;
    setInput(unit === 'in' ? cmToInches(valueCm) : valueCm);
  }, [valueCm, unit, syncKey, focused]);

  const locked = readOnly
    ? 'cursor-default border-border-sage/60 bg-cream/40 text-ink-soft'
    : 'border-border-sage/90 bg-white';

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <LabelText label={label} />
        <div className="inline-flex rounded-lg border border-border-sage/80 bg-cream/40 p-0.5">
          {(['cm', 'in'] as const).map((u) => (
            <button
              key={u}
              type="button"
              disabled={readOnly}
              onClick={() => {
                setUnit(u);
                setInput(u === 'in' ? cmToInches(valueCm) : valueCm);
              }}
              className={`rounded-md px-2.5 py-0.5 text-[10px] font-semibold uppercase transition-all ${
                unit === u
                  ? 'bg-sage-mist text-sage-deep ring-1 ring-border-sage/70'
                  : 'text-ink-soft hover:text-ink'
              } ${readOnly ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      <input
        type="text"
        inputMode="decimal"
        value={input}
        readOnly={readOnly}
        disabled={readOnly}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.]/g, '');
          setInput(raw);
          onChangeCm(unit === 'in' ? inchesToCm(raw) : raw);
        }}
        placeholder={unit === 'in' ? placeholderIn : placeholderCm}
        className={`${formInputClass} transition-shadow focus:shadow-sm ${locked}`}
      />
    </div>
  );
};

const StatCard = ({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) => (
  <div className="rounded-xl border border-sage/20 bg-gradient-to-br from-sage-mist/80 to-white px-4 py-3 shadow-sm">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
    <p className="mt-1 font-serif text-2xl font-semibold text-sage-deep">{value || '—'}</p>
    {subtitle ? (
      <p className="mt-1 text-xs font-semibold text-sage-deep/80">{subtitle}</p>
    ) : null}
  </div>
);

export const PatientClinicalInfoPanel = ({
  clinical,
  patientGender = '',
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
  const [metabolicEnabled, setMetabolicEnabled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (window.location.hash === '#patient-info') {
      setActiveSection('generalExamination');
    }
  }, [loading]);

  useEffect(() => {
    // Sync Yes/No from saved values when viewing (not while editing empty Yes cards)
    if (editing) return;
    const next: Record<string, boolean> = {};
    for (const row of METABOLIC_PAIRS) {
      const med = String(clinical.metabolicDisorder[row.medicine] ?? '').trim();
      const dur = String(clinical.metabolicDisorder[row.duration] ?? '').trim();
      next[row.medicine] = Boolean(med || dur);
    }
    setMetabolicEnabled(next);
  }, [editing, clinical.updatedAt, clinical.metabolicDisorder]);

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
      case 'generalExamination': {
        const prakritiOptions = prakritiMasters.map((m) => m.name);
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      case 'diseaseHistory': {
        const gender = String(patientGender || '').trim();
        const diseaseFields =
          gender === 'Male'
            ? DISEASE_FIELDS.filter((f) => f.key !== 'menstrual')
            : DISEASE_FIELDS;
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            {diseaseFields.map((f) => (
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
      }

      case 'diabetesHistory':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Diabetes type"
              value={clinical.diabetesHistory.diabetesType}
              options={DIABETES_TYPE_OPTIONS}
              onChange={(v) => patchNested('diabetesHistory', 'diabetesType', v)}
              readOnly={readOnly}
              placeholder="Choose..."
            />
            <Field
              label="Duration"
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
            <Field
              label="Current medicine"
              value={clinical.diabetesHistory.currentMedicine}
              onChange={(v) => patchNested('diabetesHistory', 'currentMedicine', v)}
              readOnly={readOnly}
            />
            <Field
              label="Current duration"
              value={clinical.diabetesHistory.currentMedicineDurations}
              onChange={(v) => patchNested('diabetesHistory', 'currentMedicineDurations', v)}
              readOnly={readOnly}
            />
          </div>
        );

      case 'metabolicDisorder': {
        const gender = String(patientGender || '').trim();
        const visiblePairs = METABOLIC_PAIRS.filter(
          (row) => !row.hideForGenders?.includes(gender)
        );
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {visiblePairs.map((row) => {
              const enabled = Boolean(metabolicEnabled[row.medicine]);
              return (
                <div
                  key={row.label}
                  className="rounded-xl border border-border-sage/70 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-sage-deep">
                      {row.label}
                    </p>
                    <YesNoToggle
                      value={enabled}
                      disabled={readOnly}
                      onChange={(next) => {
                        setMetabolicEnabled((prev) => ({ ...prev, [row.medicine]: next }));
                        if (!next) {
                          onChange({
                            ...clinical,
                            metabolicDisorder: {
                              ...clinical.metabolicDisorder,
                              [row.medicine]: '',
                              [row.duration]: '',
                            },
                          });
                        }
                      }}
                    />
                  </div>
                  {enabled ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label=""
                        value={clinical.metabolicDisorder[row.medicine]}
                        onChange={(v) => patchNested('metabolicDisorder', row.medicine, v)}
                        readOnly={readOnly}
                        placeholder="Medicine / Details"
                      />
                      <SelectField
                        label=""
                        value={clinical.metabolicDisorder[row.duration]}
                        options={DURATION_OPTIONS}
                        onChange={(v) => patchNested('metabolicDisorder', row.duration, v)}
                        readOnly={readOnly}
                        placeholder="Choose..."
                        required
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-ink-ghost">Select Yes to add details</p>
                  )}
                </div>
              );
            })}
          </div>
        );
      }

      case 'eatingHabits':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Food preference"
              value={clinical.eatingHabits.preference}
              options={FOOD_PREFERENCE_OPTIONS}
              onChange={(v) => patchNested('eatingHabits', 'preference', v)}
              readOnly={readOnly}
              placeholder="Choose..."
            />
            <SelectField
              label="Meal quantity"
              value={clinical.eatingHabits.quantity}
              options={MEAL_QUANTITY_OPTIONS}
              onChange={(v) => patchNested('eatingHabits', 'quantity', v)}
              readOnly={readOnly}
              placeholder="Choose..."
            />
            <SelectField
              label="Meal times"
              value={clinical.eatingHabits.schedule}
              options={MEAL_TIMES_OPTIONS}
              onChange={(v) => patchNested('eatingHabits', 'schedule', v)}
              readOnly={readOnly}
              placeholder="Choose..."
            />
            <Field
              label="Likes"
              value={clinical.eatingHabits.likes}
              onChange={(v) => patchNested('eatingHabits', 'likes', v)}
              multiline
              readOnly={readOnly}
              placeholder="Foods patient likes"
            />
            <Field
              label="Dislikes"
              value={clinical.eatingHabits.dislikes}
              onChange={(v) => patchNested('eatingHabits', 'dislikes', v)}
              multiline
              readOnly={readOnly}
              placeholder="Foods patient dislikes"
            />
          </div>
        );

      case 'physicalActivity': {
        const isActive = clinical.physicalActivity.active === true;
        const detailReadOnly = readOnly || !isActive;
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <LabelText label="Physical activity" />
              <div className="mt-1">
                <YesNoToggle
                  value={isActive}
                  disabled={readOnly}
                  onChange={(next) => {
                    if (!next) {
                      onChange({
                        ...clinical,
                        physicalActivity: {
                          ...clinical.physicalActivity,
                          active: false,
                          workPattern: '',
                          walk: '',
                          yoga: '',
                          exercise: '',
                          meditative: '',
                        },
                      });
                      return;
                    }
                    patchNested('physicalActivity', 'active', true);
                  }}
                />
              </div>
            </div>
            <SelectField
              label="Work pattern"
              value={clinical.physicalActivity.workPattern}
              options={WORK_PATTERN_OPTIONS}
              onChange={(v) => patchNested('physicalActivity', 'workPattern', v)}
              readOnly={detailReadOnly}
              placeholder="Choose..."
            />
            <SelectField
              label="Walk"
              value={clinical.physicalActivity.walk}
              options={YES_NO_OPTIONS}
              onChange={(v) => patchNested('physicalActivity', 'walk', v)}
              readOnly={detailReadOnly}
              placeholder="Choose..."
            />
            <SelectField
              label="Yoga"
              value={clinical.physicalActivity.yoga}
              options={YES_NO_OPTIONS}
              onChange={(v) => patchNested('physicalActivity', 'yoga', v)}
              readOnly={detailReadOnly}
              placeholder="Choose..."
            />
            <SelectField
              label="Exercise"
              value={clinical.physicalActivity.exercise}
              options={YES_NO_OPTIONS}
              onChange={(v) => patchNested('physicalActivity', 'exercise', v)}
              readOnly={detailReadOnly}
              placeholder="Choose..."
            />
            <SelectField
              label="Meditation"
              value={clinical.physicalActivity.meditative}
              options={YES_NO_OPTIONS}
              onChange={(v) => patchNested('physicalActivity', 'meditative', v)}
              readOnly={detailReadOnly}
              placeholder="Choose..."
            />
          </div>
        );
      }

      case 'physicalMeasurement': {
        const bmiCategory = getBmiCategory(clinical.physicalMeasurement.bmi);
        const syncKey = clinical.updatedAt;
        return (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard
                label="BMI"
                value={clinical.physicalMeasurement.bmi}
                subtitle={bmiCategory || undefined}
              />
              <StatCard label="WHR" value={clinical.physicalMeasurement.whr} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <LengthField
                label="Height"
                valueCm={clinical.physicalMeasurement.height}
                onChangeCm={(cm) => onMeasurementChange('height', cm)}
                readOnly={readOnly}
                syncKey={syncKey}
                placeholderCm="e.g. 170"
                placeholderIn="e.g. 67"
              />
              <Field
                label="Weight (kg)"
                value={clinical.physicalMeasurement.weight}
                onChange={(v) => onMeasurementChange('weight', v)}
                readOnly={readOnly}
                placeholder="e.g. 68"
              />
              <LengthField
                label="Bicep"
                valueCm={clinical.physicalMeasurement.bicep}
                onChangeCm={(cm) => onMeasurementChange('bicep', cm)}
                readOnly={readOnly}
                syncKey={syncKey}
                placeholderCm="e.g. 32"
                placeholderIn="e.g. 12.6"
              />
              <LengthField
                label="Waist"
                valueCm={clinical.physicalMeasurement.waist}
                onChangeCm={(cm) => onMeasurementChange('waist', cm)}
                readOnly={readOnly}
                syncKey={syncKey}
                placeholderCm="e.g. 80"
                placeholderIn="e.g. 31.5"
              />
              <LengthField
                label="Hip"
                valueCm={clinical.physicalMeasurement.hip}
                onChangeCm={(cm) => onMeasurementChange('hip', cm)}
                readOnly={readOnly}
                syncKey={syncKey}
                placeholderCm="e.g. 95"
                placeholderIn="e.g. 37.4"
              />
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[280px] rounded-xl bg-cream/30">
        <ContentLoader size="md" className="min-h-[280px]" />
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
                    ? 'bg-sage-mist text-sage-deep ring-1 ring-border-sage/70'
                    : 'text-ink-soft hover:bg-sage-mist/50 hover:text-ink'
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
