import type { ReactNode } from 'react';
import {
  CalendarPlus,
  Flame,
  Leaf,
  Mail,
  MapPin,
  Phone,
  Save,
  Sparkles,
  SquarePen,
  Wind,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { PatientStatusBadge } from '@/components/patients/PatientStatusBadge';
import type { MasterItem } from '@/types/api.types';
import type { PatientProfileFormValues } from '@/types/patient.types';
import type { PatientDetail } from '@/types/patientDetail.types';
import { BLOOD_GROUP_OPTIONS, GENDER_OPTIONS, STATUS_OPTIONS } from '@/utils/patientHelpers';

interface Props {
  patient: PatientDetail;
  editing: boolean;
  saving?: boolean;
  profileForm: PatientProfileFormValues;
  prakritiMasters: MasterItem[];
  treatmentMasters: MasterItem[];
  onProfileFormChange: (values: PatientProfileFormValues) => void;
  onBookAppt: () => void;
  onAiSummary?: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveProfile: () => void | Promise<void>;
}

const PRAKRITI_STYLES: Record<string, string> = {
  Vata: 'bg-violet-50 text-violet-700 ring-violet-200',
  Pitta: 'bg-orange-50 text-orange-700 ring-orange-200',
  Kapha: 'bg-sage-mist text-sage-deep ring-border-sage',
};

const PRAKRITI_ICONS: Record<string, typeof Flame> = {
  Vata: Wind,
  Pitta: Flame,
  Kapha: Leaf,
};

const DetailCell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-cream/60 px-3 py-2">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
    <p className="mt-0.5 break-words text-sm font-medium leading-snug text-ink">{value}</p>
  </div>
);

const EditField = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div>
    <label className={formLabelClass}>{label}</label>
    {children}
  </div>
);

export const PatientProfileCard = ({
  patient,
  editing,
  saving = false,
  profileForm,
  prakritiMasters,
  treatmentMasters,
  onProfileFormChange,
  onBookAppt,
  onAiSummary,
  onStartEdit,
  onCancelEdit,
  onSaveProfile,
}: Props) => {
  const PrakritiIcon = PRAKRITI_ICONS[patient.prakriti] ?? Leaf;
  const set = <K extends keyof PatientProfileFormValues>(key: K, value: PatientProfileFormValues[K]) => {
    onProfileFormChange({ ...profileForm, [key]: value });
  };

  const displayPrakriti =
    prakritiMasters.find((m) => m._id === profileForm.prakritiId)?.name ?? patient.prakriti;

  return (
    <div className="overflow-hidden rounded-2xl border border-border-sage bg-white shadow-sm">
      <div className="bg-gradient-to-b from-sage-mist/80 to-white px-5 pb-5 pt-6 text-center">
        <div
          className={`mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full text-xl font-bold ring-4 ring-white shadow-sm ${patient.avatarClass}`}
        >
          {patient.initials}
        </div>
        {editing ? (
          <div className="mt-3 text-left">
            <label className={formLabelClass}>Full name</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => set('name', e.target.value)}
              className={formInputClass}
            />
          </div>
        ) : (
          <>
            <h2 className="mt-3 break-words font-serif text-xl font-semibold text-ink">{patient.name}</h2>
            <p className="mt-0.5 break-all text-xs font-medium text-ink-ghost">#{patient.id}</p>
          </>
        )}
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
          {editing ? (
            <select
              value={profileForm.status}
              onChange={(e) => set('status', e.target.value as PatientProfileFormValues['status'])}
              className={`${formSelectClass} text-xs`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <PatientStatusBadge status={patient.status} />
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${PRAKRITI_STYLES[displayPrakriti] ?? 'bg-sage-mist text-sage-deep ring-border-sage'}`}
          >
            <PrakritiIcon className="h-3 w-3" strokeWidth={2.25} />
            {displayPrakriti} Prakriti
          </span>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-5">
        {editing ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <EditField label="Age">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={profileForm.age}
                  onChange={(e) =>
                    set('age', e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className={formInputClass}
                />
              </EditField>
              <EditField label="Gender">
                <select
                  value={profileForm.gender}
                  onChange={(e) => set('gender', e.target.value)}
                  className={formSelectClass}
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </EditField>
              <EditField label="Blood group">
                <select
                  value={profileForm.bloodGroup}
                  onChange={(e) => set('bloodGroup', e.target.value)}
                  className={formSelectClass}
                >
                  {BLOOD_GROUP_OPTIONS.map((bg) => (
                    <option key={bg || 'none'} value={bg}>
                      {bg || '—'}
                    </option>
                  ))}
                </select>
              </EditField>
              <DetailCell label="Member since" value={patient.memberSince} />
            </div>
            <EditField label="Mobile">
              <input
                type="tel"
                maxLength={10}
                value={profileForm.mobile}
                onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={formInputClass}
              />
            </EditField>
            <EditField label="Email">
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => set('email', e.target.value)}
                className={formInputClass}
              />
            </EditField>
            <EditField label="City / location">
              <input
                type="text"
                value={profileForm.city}
                onChange={(e) => set('city', e.target.value)}
                className={formInputClass}
              />
            </EditField>
            <EditField label="Treatment">
              <select
                value={profileForm.treatmentId}
                onChange={(e) => set('treatmentId', e.target.value)}
                className={formSelectClass}
              >
                <option value="">Select</option>
                {treatmentMasters.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </EditField>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <DetailCell label="Age" value={`${patient.age} yrs`} />
              <DetailCell label="Gender" value={patient.gender} />
              <DetailCell label="Blood" value={patient.bloodGroup} />
              <DetailCell label="Since" value={patient.memberSince} />
            </div>
            <div className="space-y-2 rounded-xl border border-border-sage/80 bg-cream/30 p-3">
              {patient.mobile ? (
                <div className="flex items-center gap-2 text-sm text-ink-soft">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-ink-ghost" strokeWidth={2} />
                  <span className="break-all">{patient.mobile}</span>
                </div>
              ) : null}
              {patient.email ? (
                <div className="flex items-center gap-2 text-sm text-ink-soft">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-ink-ghost" strokeWidth={2} />
                  <span className="truncate">{patient.email}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-sm text-ink-soft">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-ghost" strokeWidth={2} />
                <span>{patient.city}</span>
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button className="w-full rounded-xl py-2.5 text-sm" onClick={onBookAppt} disabled={editing}>
            <CalendarPlus className="h-4 w-4 shrink-0" strokeWidth={2} />
            Book Appt.
          </Button>
          {onAiSummary ? (
            <Button
              variant="secondary"
              className="w-full gap-1.5 rounded-xl py-2.5 text-sm"
              onClick={onAiSummary}
              disabled={editing}
            >
              <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2} />
              AI summary
            </Button>
          ) : null}
          {editing ? (
            <>
              <Button
                className="w-full gap-2 rounded-xl py-2.5 text-sm"
                onClick={() => void onSaveProfile()}
                isLoading={saving}
              >
                <Save className="h-4 w-4 shrink-0" strokeWidth={2} />
                Save profile
              </Button>
              <Button
                variant="secondary"
                className="w-full gap-1.5 rounded-xl py-2.5 text-sm"
                onClick={onCancelEdit}
                disabled={saving}
              >
                <X className="h-4 w-4 shrink-0" strokeWidth={2} />
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              className="w-full gap-1.5 rounded-xl px-3 py-2.5 text-sm"
              onClick={onStartEdit}
            >
              <SquarePen className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="text-center leading-snug">Edit profile</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
