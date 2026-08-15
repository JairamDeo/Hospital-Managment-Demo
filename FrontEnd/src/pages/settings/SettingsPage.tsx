import { useState, type ReactNode } from 'react';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { SettingsSectionCard } from '@/components/settings/SettingsSectionCard';
import { SettingsToggle } from '@/components/settings/SettingsToggle';
import { Input } from '@/components/ui/Input';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { RbacSettingsPanel } from '@/components/settings/RbacSettingsPanel';
import { useToast } from '@/hooks/useToast';
import { formatDisplayName, getInitials } from '@/utils/helpers';
import {
  DEFAULT_SETTINGS,
  SLOT_OPTIONS,
  TIMEZONE_OPTIONS,
  type AppSettings,
  type SettingsSectionId,
} from './data/mockSettings';

const Field = ({
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

export const SettingsPage = () => {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const { showToast } = useToast();
  const [active, setActive] = useState<SettingsSectionId>(isAdmin ? 'clinic' : 'account');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const displayName = formatDisplayName(user?.firstName, user?.lastName, user?.name);
  const initials = getInitials(user?.firstName, user?.lastName);

  const save = (section: string) => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast(`${section} settings saved`, 'success');
    }, 400);
  };

  const updateClinic = <K extends keyof AppSettings['clinic']>(
    key: K,
    value: AppSettings['clinic'][K]
  ) => setSettings((s) => ({ ...s, clinic: { ...s.clinic, [key]: value } }));

  const updateAppointments = <K extends keyof AppSettings['appointments']>(
    key: K,
    value: AppSettings['appointments'][K]
  ) => setSettings((s) => ({ ...s, appointments: { ...s.appointments, [key]: value } }));

  const updateBilling = <K extends keyof AppSettings['billing']>(
    key: K,
    value: AppSettings['billing'][K]
  ) => setSettings((s) => ({ ...s, billing: { ...s.billing, [key]: value } }));

  const updatePanchakarma = <K extends keyof AppSettings['panchakarma']>(
    key: K,
    value: AppSettings['panchakarma'][K]
  ) => setSettings((s) => ({ ...s, panchakarma: { ...s.panchakarma, [key]: value } }));

  const updateNotifications = <K extends keyof AppSettings['notifications']>(
    key: K,
    value: AppSettings['notifications'][K]
  ) => setSettings((s) => ({ ...s, notifications: { ...s.notifications, [key]: value } }));

  return (
    <div className="pb-6">
      <div className="mb-5">
        <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Manage clinic profile, modules, notifications &amp; security
        </p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-[220px] xl:w-[240px]">
          <SettingsSidebar active={active} onChange={setActive} isAdmin={isAdmin} />
        </aside>

        <div className="min-w-0 flex-1">
          {active === 'clinic' ? (
            <SettingsSectionCard
              title="Clinic Profile"
              description="Hospital name, contact details and registration shown across the system."
              onSave={() => save('Clinic')}
              saving={saving}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Hospital Name">
                  <input
                    className={formInputClass}
                    value={settings.clinic.name}
                    onChange={(e) => updateClinic('name', e.target.value)}
                  />
                </Field>
                <Field label="Tagline">
                  <input
                    className={formInputClass}
                    value={settings.clinic.tagline}
                    onChange={(e) => updateClinic('tagline', e.target.value)}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address">
                    <input
                      className={formInputClass}
                      value={settings.clinic.address}
                      onChange={(e) => updateClinic('address', e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="City / Pin">
                  <input
                    className={formInputClass}
                    value={settings.clinic.city}
                    onChange={(e) => updateClinic('city', e.target.value)}
                  />
                </Field>
                <Field label="Timezone">
                  <select
                    className={formSelectClass}
                    value={settings.clinic.timezone}
                    onChange={(e) => updateClinic('timezone', e.target.value)}
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Phone">
                  <input
                    className={formInputClass}
                    value={settings.clinic.phone}
                    onChange={(e) => updateClinic('phone', e.target.value)}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    className={formInputClass}
                    value={settings.clinic.email}
                    onChange={(e) => updateClinic('email', e.target.value)}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Registration No.">
                    <input
                      className={formInputClass}
                      value={settings.clinic.registrationNo}
                      onChange={(e) => updateClinic('registrationNo', e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </SettingsSectionCard>
          ) : null}

          {active === 'account' ? (
            <SettingsSectionCard
              title="My Account"
              description="Your admin profile linked to login and dashboard."
              onSave={() => save('Account')}
              saving={saving}
            >
              <div className="mb-5 flex items-center gap-4 rounded-xl bg-sage-mist/50 p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-pale text-lg font-bold text-sage-deep">
                  {initials}
                </div>
                <div>
                  <p className="font-serif text-lg font-semibold text-ink">Dr. {displayName}</p>
                  <p className="text-sm text-ink-soft">{user?.role ?? 'Chief Physician'}</p>
                  <p className="text-xs text-ink-ghost">#{user?.userCode ?? 'ADM-001'}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="First Name" defaultValue={user?.firstName ?? 'Ananya'} />
                <Input label="Last Name" defaultValue={user?.lastName ?? 'Sharma'} />
                <Input
                  label="Email"
                  type="email"
                  defaultValue={user?.email ?? 'admin@ayurvedahealth.com'}
                  className="sm:col-span-2"
                />
                <Input
                  label="Mobile"
                  defaultValue={user?.mobileNumber ?? '9820012345'}
                  className="sm:col-span-2"
                />
              </div>
            </SettingsSectionCard>
          ) : null}

          {active === 'appointments' ? (
            <SettingsSectionCard
              title="Appointment Settings"
              description="Working hours and scheduling rules for the Appointments calendar."
              onSave={() => save('Appointment')}
              saving={saving}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Opens At">
                  <input
                    type="time"
                    className={formInputClass}
                    value={settings.appointments.openTime}
                    onChange={(e) => updateAppointments('openTime', e.target.value)}
                  />
                </Field>
                <Field label="Closes At">
                  <input
                    type="time"
                    className={formInputClass}
                    value={settings.appointments.closeTime}
                    onChange={(e) => updateAppointments('closeTime', e.target.value)}
                  />
                </Field>
                <Field label="Slot Duration">
                  <select
                    className={formSelectClass}
                    value={settings.appointments.slotMinutes}
                    onChange={(e) =>
                      updateAppointments('slotMinutes', Number(e.target.value))
                    }
                  >
                    {SLOT_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Max Daily Appointments">
                  <input
                    type="number"
                    min={1}
                    className={formInputClass}
                    value={settings.appointments.maxDailyAppointments}
                    onChange={(e) =>
                      updateAppointments('maxDailyAppointments', Number(e.target.value))
                    }
                  />
                </Field>
              </div>
              <div className="mt-2 divide-y divide-border-sage/80">
                <SettingsToggle
                  label="Close on Weekends"
                  description="Saturday & Sunday marked as non-working days on the calendar."
                  checked={settings.appointments.weekendClosed}
                  onChange={(v) => updateAppointments('weekendClosed', v)}
                />
              </div>
            </SettingsSectionCard>
          ) : null}

          {active === 'billing' ? (
            <SettingsSectionCard
              title="Billing Settings"
              description="Invoice format, tax and payment defaults used on the Billing page."
              onSave={() => save('Billing')}
              saving={saving}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tax / GST (%)">
                  <input
                    type="number"
                    min={0}
                    max={28}
                    className={formInputClass}
                    value={settings.billing.taxPercent}
                    onChange={(e) => updateBilling('taxPercent', Number(e.target.value))}
                  />
                </Field>
                <Field label="Invoice Prefix">
                  <input
                    className={formInputClass}
                    value={settings.billing.invoicePrefix}
                    onChange={(e) => updateBilling('invoicePrefix', e.target.value)}
                  />
                </Field>
                <Field label="Payment Due (days)">
                  <input
                    type="number"
                    min={1}
                    className={formInputClass}
                    value={settings.billing.paymentDueDays}
                    onChange={(e) => updateBilling('paymentDueDays', Number(e.target.value))}
                  />
                </Field>
              </div>
              <div className="mt-2 divide-y divide-border-sage/80">
                <SettingsToggle
                  label="Auto Payment Reminders"
                  description="Send reminders for pending and overdue invoices."
                  checked={settings.billing.autoPaymentReminder}
                  onChange={(v) => updateBilling('autoPaymentReminder', v)}
                />
                <SettingsToggle
                  label="Accept Insurance Claims"
                  description="Enable insurance provider and claim fields on invoices."
                  checked={settings.billing.acceptInsurance}
                  onChange={(v) => updateBilling('acceptInsurance', v)}
                />
              </div>
            </SettingsSectionCard>
          ) : null}

          {active === 'panchakarma' ? (
            <SettingsSectionCard
              title="Panchakarma Settings"
              description="Defaults for therapy programs, rooms and patient intake."
              onSave={() => save('Panchakarma')}
              saving={saving}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Default Program (days)">
                  <input
                    type="number"
                    min={1}
                    className={formInputClass}
                    value={settings.panchakarma.defaultProgramDays}
                    onChange={(e) =>
                      updatePanchakarma('defaultProgramDays', Number(e.target.value))
                    }
                  />
                </Field>
                <Field label="Max Concurrent Patients">
                  <input
                    type="number"
                    min={1}
                    className={formInputClass}
                    value={settings.panchakarma.maxConcurrentPatients}
                    onChange={(e) =>
                      updatePanchakarma('maxConcurrentPatients', Number(e.target.value))
                    }
                  />
                </Field>
                <Field label="Treatment Rooms">
                  <input
                    type="number"
                    min={1}
                    className={formInputClass}
                    value={settings.panchakarma.therapyRooms}
                    onChange={(e) =>
                      updatePanchakarma('therapyRooms', Number(e.target.value))
                    }
                  />
                </Field>
              </div>
              <div className="mt-2 divide-y divide-border-sage/80">
                <SettingsToggle
                  label="Require Consent Form"
                  description="Mandatory consent upload before starting a Panchakarma program."
                  checked={settings.panchakarma.requireConsentForm}
                  onChange={(v) => updatePanchakarma('requireConsentForm', v)}
                />
              </div>
            </SettingsSectionCard>
          ) : null}

          {active === 'notifications' ? (
            <SettingsSectionCard
              title="Notifications"
              description="Choose which alerts you receive across Patients, Billing, Pharmacy & more."
              onSave={() => save('Notification')}
              saving={saving}
            >
              <div className="divide-y divide-border-sage/80">
                <SettingsToggle
                  label="Appointment Reminders"
                  description="Upcoming and same-day appointment alerts."
                  checked={settings.notifications.appointmentReminders}
                  onChange={(v) => updateNotifications('appointmentReminders', v)}
                />
                <SettingsToggle
                  label="Billing Alerts"
                  description="Pending payments and overdue invoice notifications."
                  checked={settings.notifications.billingAlerts}
                  onChange={(v) => updateNotifications('billingAlerts', v)}
                />
                <SettingsToggle
                  label="Pharmacy Low Stock"
                  description="Critical and low stock alerts from the Pharmacy module."
                  checked={settings.notifications.pharmacyLowStock}
                  onChange={(v) => updateNotifications('pharmacyLowStock', v)}
                />
                <SettingsToggle
                  label="Panchakarma Updates"
                  description="Program progress and therapy room schedule changes."
                  checked={settings.notifications.panchakarmaUpdates}
                  onChange={(v) => updateNotifications('panchakarmaUpdates', v)}
                />
                <SettingsToggle
                  label="Email Notifications"
                  description="Receive alerts via registered email."
                  checked={settings.notifications.emailNotifications}
                  onChange={(v) => updateNotifications('emailNotifications', v)}
                />
                <SettingsToggle
                  label="SMS Notifications"
                  description="Send appointment and follow-up reminders to patients by SMS."
                  checked={settings.notifications.smsNotifications}
                  onChange={(v) => updateNotifications('smsNotifications', v)}
                />
              </div>
            </SettingsSectionCard>
          ) : null}

          {active === 'rbac' && isAdmin ? (
            <RbacSettingsPanel />
          ) : null}

          {active === 'security' ? (
            <SettingsSectionCard
              title="Security"
              description="Update your admin password. Use a strong password with mixed characters."
              onSave={() => {
                if (!security.currentPassword || !security.newPassword) {
                  showToast('Please fill all password fields', 'error');
                  return;
                }
                if (security.newPassword !== security.confirmPassword) {
                  showToast('New passwords do not match', 'error');
                  return;
                }
                save('Security');
                setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
              saving={saving}
            >
              <div className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={security.currentPassword}
                  onChange={(e) =>
                    setSecurity((s) => ({ ...s, currentPassword: e.target.value }))
                  }
                  autoComplete="current-password"
                />
                <Input
                  label="New Password"
                  type="password"
                  value={security.newPassword}
                  onChange={(e) => setSecurity((s) => ({ ...s, newPassword: e.target.value }))}
                  autoComplete="new-password"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={security.confirmPassword}
                  onChange={(e) =>
                    setSecurity((s) => ({ ...s, confirmPassword: e.target.value }))
                  }
                  autoComplete="new-password"
                />
              </div>
              <p className="mt-4 rounded-lg bg-cream/80 px-3 py-2 text-xs text-ink-soft">
                Forgot your password? Use the{' '}
                <a href="/forgot-password" className="font-medium text-sage-deep hover:underline">
                  reset password
                </a>{' '}
                flow from the login page.
              </p>
            </SettingsSectionCard>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
