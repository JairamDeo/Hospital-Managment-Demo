import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Stethoscope, Headphones, Leaf, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { rbacAdminService } from '@/services/rbac/rbacAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  RBAC_MODULE_KEYS,
  RBAC_MODULE_LABELS,
  type RbacRoleConfig,
  type StaffRole,
} from '@/types/rbac.types';

const ROLES: StaffRole[] = ['Doctor', 'Therapist', 'Support', 'Lab'];

const ROLE_META: Record<
  StaffRole,
  { summary: string; icon: typeof Stethoscope }
> = {
  Doctor: {
    summary: 'Dashboard, Appointments & patient details',
    icon: Stethoscope,
  },
  Therapist: {
    summary: 'Dashboard & Panchakarma scheduling',
    icon: Leaf,
  },
  Support: {
    summary: 'Front desk — patients, appointments & billing',
    icon: Headphones,
  },
  Lab: {
    summary: 'Lab workspace by default — admin can enable extra modules below',
    icon: FlaskConical,
  },
};

const countEnabled = (config: RbacRoleConfig) =>
  RBAC_MODULE_KEYS.filter((key) => config.modules[key]?.view).length;

export const RbacSettingsPanel = () => {
  const { showToast } = useToast();
  const [configs, setConfigs] = useState<RbacRoleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState<StaffRole | null>(null);
  const [expanded, setExpanded] = useState<Partial<Record<StaffRole, boolean>>>({
    Doctor: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await rbacAdminService.list();
      setConfigs(data.res?.configs ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleExpanded = (role: StaffRole) => {
    setExpanded((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const toggle = (role: StaffRole, moduleKey: string, field: 'view' | 'edit', value: boolean) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.role !== role
          ? c
          : {
              ...c,
              modules: {
                ...c.modules,
                [moduleKey]: {
                  ...c.modules[moduleKey as keyof typeof c.modules],
                  [field]: value,
                  ...(field === 'view' && !value ? { edit: false } : {}),
                },
              },
            }
      )
    );
  };

  const saveRole = async (role: StaffRole) => {
    const config = configs.find((c) => c.role === role);
    if (!config) return;
    setSavingRole(role);
    try {
      const { data } = await rbacAdminService.update(role, config.modules);
      const saved = data.res?.config;
      if (saved) {
        setConfigs((prev) => prev.map((c) => (c.role === role ? saved : c)));
      } else {
        await load();
      }
      showToast(`${role} access saved — users with this role should refresh`, 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      await load();
    } finally {
      setSavingRole(null);
    }
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-ink-soft">Loading access rules…</p>;
  }

  return (
    <div className="rounded-2xl border border-border-sage bg-white shadow-sm">
      <div className="border-b border-border-sage px-5 py-4">
        <h2 className="font-serif text-lg font-semibold text-ink">Access Control</h2>
        <p className="mt-0.5 text-sm text-ink-soft">
          Toggle module access per staff role, then click Save. Changes are stored permanently and
          apply after that role&apos;s users refresh or re-login.
        </p>
      </div>

      <div className="divide-y divide-border-sage p-3 sm:p-4">
        {ROLES.map((role) => {
          const config = configs.find((c) => c.role === role);
          if (!config) return null;

          const isOpen = Boolean(expanded[role]);
          const enabledCount = countEnabled(config);
          const RoleIcon = ROLE_META[role].icon;

          return (
            <div
              key={role}
              className="overflow-hidden rounded-xl border border-border-sage bg-cream/20"
            >
              <button
                type="button"
                onClick={() => toggleExpanded(role)}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-cream/60"
                aria-expanded={isOpen}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage-pale text-sage-deep">
                  <RoleIcon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{role}</p>
                  <p className="truncate text-xs text-ink-soft">{ROLE_META[role].summary}</p>
                </div>
                <span className="hidden shrink-0 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-ghost ring-1 ring-border-sage sm:inline">
                  {enabledCount} module{enabledCount === 1 ? '' : 's'}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-ink-soft transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  strokeWidth={1.75}
                />
              </button>

              {isOpen ? (
                <div className="border-t border-border-sage bg-white">
                  <div className="flex items-center justify-between border-b border-border-sage/80 px-4 py-2">
                    <p className="text-xs text-ink-ghost">
                      {enabledCount} of {RBAC_MODULE_KEYS.length} modules enabled
                    </p>
                    <Button
                      className="px-3 py-1.5 text-xs"
                      onClick={() => saveRole(role)}
                      disabled={savingRole === role}
                    >
                      {savingRole === role ? 'Saving…' : 'Save role'}
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border-sage bg-cream/40">
                          <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                            Module
                          </th>
                          <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                            View
                          </th>
                          <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                            Edit
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {RBAC_MODULE_KEYS.map((key) => (
                          <tr key={key} className="border-b border-border-sage/60 last:border-b-0">
                            <td className="px-4 py-2.5 font-medium text-ink">
                              {RBAC_MODULE_LABELS[key]}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={config.modules[key]?.view ?? false}
                                onChange={(e) => toggle(role, key, 'view', e.target.checked)}
                                className="h-4 w-4 accent-sage-deep"
                              />
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={config.modules[key]?.edit ?? false}
                                disabled={!config.modules[key]?.view}
                                onChange={(e) => toggle(role, key, 'edit', e.target.checked)}
                                className="h-4 w-4 accent-sage-deep disabled:opacity-40"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
