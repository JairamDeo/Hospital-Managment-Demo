import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerAuthShell } from '@/components/customer/layout/CustomerAuthShell';
import { Input } from '@/components/ui/Input';
import { FormSelect } from '@/components/ui/FormSelect';
import { Button } from '@/components/ui/Button';
import { patientPortalAuthService } from '@/services/auth/patientPortalAuth.service';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { getApiErrorMessage } from '@/utils/helpers';
import type { PatientRegisterPayload } from '@/types/api.types';
import type { MasterItem } from '@/types/api.types';

const GENDERS: PatientRegisterPayload['gender'][] = ['Male', 'Female', 'Other'];

type RegisterForm = Omit<PatientRegisterPayload, 'age'> & {
  age: number | '';
};

export const CustomerRegisterPage = () => {
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    mobileNumber: '',
    age: '',
    gender: 'Male',
    prakritiId: '',
    treatmentId: '',
  });
  const [prakritiList, setPrakritiList] = useState<MasterItem[]>([]);
  const [treatmentList, setTreatmentList] = useState<MasterItem[]>([]);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    patientPortalAuthService
      .getMasters()
      .then(({ data }) => {
        setPrakritiList(data.res?.prakriti ?? []);
        setTreatmentList(data.res?.treatments ?? []);
      })
      .catch(() => {});
  }, []);

  const set = <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!/^[0-9]{10}$/.test(form.mobileNumber)) next.mobileNumber = 'Enter 10-digit mobile';
    if (form.email?.trim() && !/\S+@\S+\.\S+/.test(form.email)) next.email = 'Invalid email';
    if (form.age === '' || form.age < 1 || form.age > 120) next.age = 'Enter valid age';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || form.age === '') return;
    setLoading(true);
    try {
      const { data } = await patientPortalAuthService.register({
        name: form.name.trim(),
        mobileNumber: form.mobileNumber,
        age: form.age,
        gender: form.gender,
        email: form.email?.trim() || undefined,
        prakritiId: form.prakritiId || undefined,
        treatmentId: form.treatmentId || undefined,
      });
      showToast(data.message, 'success');
      navigate(ROUTES.CUSTOMER_VERIFY_OTP, {
        state: {
          mobile: data.res?.mobileNumber ?? form.mobileNumber,
          mode: 'register' as const,
          otpMeta: data.res,
        },
      });
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerAuthShell
      title="Register"
      subtitle="Create your Ayurveda patient account"
      showBack
      backTo={ROUTES.CUSTOMER_WELCOME}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-border-sage bg-white p-5 shadow-sm"
      >
        <Input
          label="Full Name *"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          placeholder="Your name"
        />
        <Input
          label="Mobile Number *"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={form.mobileNumber}
          onChange={(e) => set('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
          error={errors.mobileNumber}
          placeholder="10-digit mobile"
        />
        <p className="-mt-2 text-xs text-ink-ghost">
          Mobile must be new — each number can register only once.
        </p>
        <Input
          label="Email (optional)"
          type="email"
          value={form.email ?? ''}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
          placeholder="you@email.com"
        />
        <Input
          label="Age *"
          type="number"
          min={1}
          max={120}
          value={form.age === '' ? '' : String(form.age)}
          onChange={(e) => {
            const v = e.target.value;
            set('age', v === '' ? '' : Number(v));
          }}
          error={errors.age}
          placeholder="Enter your age"
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
          onChange={(v) => set('prakritiId', v)}
          placeholder="Select prakriti"
          options={prakritiList.map((p) => ({ value: p._id, label: p.name }))}
        />
        <FormSelect
          label="Treatment interest (optional)"
          value={form.treatmentId ?? ''}
          onChange={(v) => set('treatmentId', v)}
          placeholder="Select treatment"
          options={treatmentList.map((t) => ({ value: t._id, label: t.name }))}
        />
        <Button type="submit" className="w-full" isLoading={loading}>
          Register & Send OTP
        </Button>
      </form>
    </CustomerAuthShell>
  );
};

export default CustomerRegisterPage;
