import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, FlaskConical, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { labAdminService, type LabStats } from '@/services/lab/labAdmin.service';
import { formatDisplayName, getInitials, getApiErrorMessage } from '@/utils/helpers';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';

/** Lab-role home content for /admin/dashboard — analytics only (no inventory). */
export const LabDashboardPanel = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<LabStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await labAdminService.getStats();
      setStats(res.data.res?.stats ?? null);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const name = formatDisplayName(user?.firstName, user?.lastName, user?.name);
  const initials = getInitials(user?.firstName, user?.lastName);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="flex h-full min-h-0 flex-col space-y-5 overflow-y-auto">
      <div className="flex shrink-0 items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage-pale text-base font-bold text-sage-deep ring-2 ring-sage-light/40">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-soft">{greeting},</p>
          <h2 className="mt-1 truncate font-serif text-2xl font-semibold leading-tight text-ink">
            {name}
          </h2>
          <p className="mt-1 text-xs text-ink-soft">Lab overview — requests &amp; test analytics</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border-sage bg-gradient-to-br from-sage-mist/80 to-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-sage-deep" />
            <div>
              <p className="font-serif text-lg font-semibold text-ink">Lab dashboard</p>
              <p className="text-xs text-ink-soft">Master-test analytics. Work on requests under Lab.</p>
            </div>
          </div>
          <Link
            to={ROUTES.ADMIN_LAB}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-sage bg-white px-3 py-2 text-xs font-semibold text-sage-deep hover:bg-sage-mist"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Open lab requests
            <Link2 className="h-3 w-3 opacity-60" />
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft">Loading analytics…</p>
      ) : (
        <>
          <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: 'Requests', value: stats?.totalOrders ?? 0 },
              { label: 'Pending', value: stats?.pendingOrders ?? 0 },
              { label: 'Completed', value: stats?.completedOrders ?? 0 },
              { label: 'Reports filed', value: stats?.totalReports ?? 0 },
              { label: 'Master tests', value: stats?.masterTestCount ?? 0 },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-border-sage bg-white px-4 py-3 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-ink">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-sage bg-white">
              <div className="shrink-0 border-b border-border-sage px-4 py-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                  Analytics by category
                </h3>
              </div>
              <ul className="flex-1 space-y-2 overflow-y-auto p-3">
                {(stats?.categoryStats ?? []).length === 0 ? (
                  <li className="py-6 text-center text-sm text-ink-ghost">No categories in master.</li>
                ) : (
                  (stats?.categoryStats ?? []).map((row) => (
                    <li
                      key={row.code || row.name}
                      className="rounded-lg border border-border-sage/70 px-3 py-2"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-ink">{row.name}</span>
                        <span className="text-xs text-ink-soft">{row.testCount ?? 0} tests</span>
                      </div>
                      <p className="mt-1 text-xs text-ink-soft">
                        Requested {row.requested ?? 0} · Completed {row.completed ?? 0} · Reports{' '}
                        {row.reports ?? 0}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-sage bg-white">
              <div className="shrink-0 border-b border-border-sage px-4 py-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                  Analytics by test
                </h3>
              </div>
              <ul className="flex-1 space-y-2 overflow-y-auto p-3">
                {(stats?.testStats ?? []).length === 0 ? (
                  <li className="py-6 text-center text-sm text-ink-ghost">No tests in master.</li>
                ) : (
                  (stats?.testStats ?? []).map((row) => (
                    <li
                      key={row.code || row.name}
                      className="rounded-lg border border-border-sage/70 px-3 py-2"
                    >
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="font-semibold text-ink">{row.name}</span>
                        <span className="shrink-0 text-[10px] text-ink-ghost">{row.categoryName}</span>
                      </div>
                      <p className="mt-1 text-xs text-ink-soft">
                        Requested {row.requested ?? 0} · Done {row.completed ?? 0} · Reports{' '}
                        {row.reports ?? 0}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
};
