import { useEffect, useState } from 'react';
import { Leaf, LogOut, Mail, Phone, SquarePen, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormSelect } from '@/components/ui/FormSelect';
import { PrakritiBadge } from '@/components/patients/PrakritiBadge';
import { usePatientPortalAuth } from '@/hooks/usePatientPortalAuth';
import { useToast } from '@/hooks/useToast';
import { patientPortalAuthService } from '@/services/auth/patientPortalAuth.service';
import { patientAuthStorage } from '@/store/patientAuthStorage';
import { ROUTES } from '@/constants/routes';
import { getApiErrorMessage } from '@/utils/helpers';
import type { MasterItem, PatientUpdateProfilePayload, PatientUser } from '@/types/api.types';

const GENDERS: PatientUser['gender'][] = ['Male', 'Female', 'Other'];

const toForm = (patient: PatientUser): PatientUpdateProfilePayload => ({
  name: patient.name,
  email: patient.email,
  age: patient.age,
  gender: patient.gender,
  prakritiId: patient.prakritiId ?? null,
  treatmentId: patient.treatmentId ?? null,
});

export const CustomerProfilePage = () => {
  const { patient, logout, persistSession } = usePatientPortalAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PatientUpdateProfilePayload>({});
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [prakritiList, setPrakritiList] = useState<MasterItem[]>([]);
  const [treatmentList, setTreatmentList] = useState<MasterItem[]>([]);

  useEffect(() => {
    patientPortalAuthService
      .getMasters()
      .then(({ data }) => {
        setPrakritiList(data.res?.prakriti ?? []);
        setTreatmentList(data.res?.treatments ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (patient) {
      setForm(toForm(patient));
    }
  }, [patient]);

  if (!patient) return null;

  const set = <K extends keyof PatientUpdateProfilePayload>(
    key: K,
    value: PatientUpdateProfilePayload[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name?.trim()) next.name = 'Name is required';
    if (form.email?.trim() && !/\S+@\S+\.\S+/.test(form.email)) next.email = 'Invalid email';
    if (!form.age || form.age < 1 || form.age > 120) next.age = 'Enter valid age';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data } = await patientPortalAuthService.updateProfile({
        name: form.name?.trim(),
        email: form.email?.trim() || undefined,
        age: form.age,
        gender: form.gender,
        prakritiId: form.prakritiId ?? null,
        treatmentId: form.treatmentId ?? null,
      });
      if (!data.res?.patient) throw new Error('Update failed');
      const token = patientAuthStorage.get()?.token;
      if (token) {
        persistSession(token, data.res.patient);
      }
      showToast(data.message || 'Profile updated', 'success');
      setEditing(false);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(toForm(patient));
    setErrors({});
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    navigate(ROUTES.CUSTOMER_WELCOME, { replace: true });
  };

  const prakritiLabel = patient.prakritiName ?? patient.prakriti;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border-sage bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sage-pale text-2xl font-bold text-sage-deep">
          {(editing ? form.name : patient.name)
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <h2 className="mt-4 font-serif text-xl font-semibold text-ink">
          {editing ? form.name : patient.name}
        </h2>
        <p className="text-sm text-ink-ghost">#{patient.patientCode}</p>
        {!editing ? (
          <Button
            variant="secondary"
            className="mt-4 gap-1.5 rounded-xl"
            onClick={() => setEditing(true)}
          >
            <SquarePen className="h-4 w-4" strokeWidth={2} />
            Edit Profile
          </Button>
        ) : null}
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4 rounded-2xl border border-border-sage bg-white p-5 shadow-sm"
        >
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            Edit profile
          </h3>
          <Input
            label="Full Name"
            value={form.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
          />
          <Input
            label="Email (optional)"
            type="email"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            error={errors.email}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">Mobile</label>
            <p className="rounded-xl border border-border-sage bg-cream/50 px-3 py-2.5 text-sm text-ink-soft">
              +91 {patient.mobileNumber}
            </p>
            <p className="mt-1 text-[11px] text-ink-ghost">Mobile cannot be changed here</p>
          </div>
          <Input
            label="Age"
            type="number"
            min={1}
            max={120}
            value={String(form.age ?? '')}
            onChange={(e) => set('age', Number(e.target.value))}
            error={errors.age}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">Gender</label>
            <div className="grid grid-cols-3 gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => set('gender', g)}
                  className={`cursor-pointer rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                    form.gender === g
                      ? 'border-sage-deep bg-sage-mist text-sage-deep'
                      : 'border-border-sage bg-cream/50 text-ink-soft hover:bg-sage-mist/50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <FormSelect
            label="Prakriti (optional)"
            value={form.prakritiId ?? ''}
            onChange={(v) => set('prakritiId', v || null)}
            placeholder="Select prakriti"
            options={prakritiList.map((p) => ({ value: p._id, label: p.name }))}
            clearable
            clearLabel="Not set"
          />
          <FormSelect
            label="Treatment (optional)"
            value={form.treatmentId ?? ''}
            onChange={(v) => set('treatmentId', v || null)}
            placeholder="Select treatment"
            options={treatmentList.map((t) => ({ value: t._id, label: t.name }))}
            clearable
            clearLabel="Not set"
          />
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1 rounded-xl" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 rounded-xl" isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 rounded-2xl border border-border-sage bg-white p-5 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            Profile details
          </h3>
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            <Phone className="h-4 w-4 shrink-0 text-ink-ghost" />
            +91 {patient.mobileNumber}
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            <Mail className="h-4 w-4 shrink-0 text-ink-ghost" />
            {patient.email || '—'}
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            <UserRound className="h-4 w-4 shrink-0 text-ink-ghost" />
            {patient.age} years · {patient.gender}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border-sage/80 pt-3">
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <Leaf className="h-4 w-4 shrink-0 text-sage-deep" strokeWidth={2} />
              Prakriti
            </div>
            {prakritiLabel ? (
              <PrakritiBadge prakriti={prakritiLabel} />
            ) : (
              <span className="text-xs text-ink-ghost">Not set — tap Edit Profile</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink-soft">Treatment</span>
            <span className="text-sm font-medium text-ink">
              {patient.treatmentName ?? patient.treatment ?? '—'}
            </span>
          </div>
        </div>
      )}

      <Button
        variant="secondary"
        className="w-full gap-2 border-danger/30 text-danger hover:bg-danger-bg"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
        Logout
      </Button>
    </div>
  );
};

export default CustomerProfilePage;
