import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmActionModal } from '@/components/staff/detail/ConfirmActionModal';
import { staffProfileService } from '@/services/staff/staffProfile.service';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/helpers';
import { countLeaveDaysExcludingSunday, datesInRangeExcludingSunday } from '@/utils/leaveDays.util';
import type { StaffLeaveRecord } from '@/types/staffProfile.types';

const LEAVE_STATUS: Record<StaffLeaveRecord['status'], string> = {
  Approved: 'bg-success-bg text-success',
  Pending: 'bg-warning-bg text-warning',
  Rejected: 'bg-danger-bg text-danger',
};

interface Props {
  staffCode: string;
  staffName: string;
  isAdmin: boolean;
  isOwnProfile: boolean;
  onLeaveChanged?: () => void;
}

type PendingAction = { type: 'apply' } | { type: 'approve' | 'reject'; leave: StaffLeaveRecord };

export const StaffLeavePanel = ({
  staffCode,
  staffName,
  isAdmin,
  isOwnProfile,
  onLeaveChanged,
}: Props) => {
  const { showToast } = useToast();
  const [records, setRecords] = useState<StaffLeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaveType, setLeaveType] = useState<'Casual' | 'Sick'>('Casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState<PendingAction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await staffProfileService.listLeave(staffCode);
      setRecords(data.res?.leave ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [staffCode, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const previewDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return countLeaveDaysExcludingSunday(startDate, endDate);
  }, [startDate, endDate]);

  const previewDates = useMemo(() => {
    if (!startDate || !endDate) return [];
    return datesInRangeExcludingSunday(startDate, endDate);
  }, [startDate, endDate]);

  const runConfirm = async () => {
    if (!confirm) return;
    setSubmitting(true);
    try {
      if (confirm.type === 'apply') {
        await staffProfileService.applyLeave(staffCode, { leaveType, startDate, endDate });
        showToast('Leave request submitted — pending approval', 'success');
        setStartDate('');
        setEndDate('');
      } else if (confirm.type === 'approve') {
        await staffProfileService.approveLeave(confirm.leave.id);
        showToast('Leave approved', 'success');
      } else {
        await staffProfileService.rejectLeave(confirm.leave.id);
        showToast('Leave rejected', 'success');
      }
      await load();
      onLeaveChanged?.();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
      setConfirm(null);
    }
  };

  const confirmCopy = () => {
    if (!confirm) return { title: '', message: '', label: 'Confirm' };
    if (confirm.type === 'apply') {
      return {
        title: 'Apply for leave?',
        message: `Submit ${leaveType} leave for ${previewDays} day${previewDays === 1 ? '' : 's'} (${previewDates.map((d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })).join(', ')})? Sundays are excluded. Status will be Pending until admin approves.`,
        label: 'Apply',
      };
    }
    if (confirm.type === 'approve') {
      return {
        title: 'Approve leave?',
        message: `Approve ${staffName}'s ${confirm.leave.type} leave (${confirm.leave.days} day${confirm.leave.days === 1 ? '' : 's'}) from ${confirm.leave.from} to ${confirm.leave.to}?`,
        label: 'Approve',
      };
    }
    return {
      title: 'Reject leave?',
      message: `Reject ${staffName}'s ${confirm.leave.type} leave request from ${confirm.leave.from} to ${confirm.leave.to}?`,
      label: 'Reject',
      variant: 'danger' as const,
    };
  };

  const copy = confirmCopy();

  if (loading) {
    return <p className="py-8 text-center text-sm text-ink-soft">Loading leave records…</p>;
  }

  return (
    <div className="space-y-5">
      {isOwnProfile ? (
        <div className="rounded-xl border border-border-sage bg-cream/30 p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Apply for leave</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-ink-ghost">Type</span>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as 'Casual' | 'Sick')}
                className="w-full rounded-lg border border-border-sage bg-white px-3 py-2 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-pale"
              >
                <option value="Casual">Casual</option>
                <option value="Sick">Sick</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-ink-ghost">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-border-sage bg-white px-3 py-2 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-pale"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-ink-ghost">To</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-border-sage bg-white px-3 py-2 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-pale"
              />
            </label>
            <div className="flex flex-col justify-end">
              <p className="mb-2 text-xs text-ink-soft">
                Total days (excl. Sunday):{' '}
                <span className="font-bold text-sage-deep">{previewDays || '—'}</span>
              </p>
              <Button
                disabled={previewDays < 1 || submitting}
                onClick={() => setConfirm({ type: 'apply' })}
              >
                Apply for leave
              </Button>
            </div>
          </div>
          {previewDates.length > 0 ? (
            <p className="mt-2 text-xs text-ink-ghost">
              Counted dates:{' '}
              {previewDates
                .map((d) =>
                  new Date(`${d}T12:00:00`).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                  })
                )
                .join(', ')}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border-sage">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-border-sage bg-cream/60">
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                Type
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                From
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                To
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                Days
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                Status
              </th>
              {isAdmin ? (
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-4 py-10 text-center text-sm text-ink-soft">
                  No leave records yet.
                </td>
              </tr>
            ) : null}
            {records.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30"
              >
                <td className="px-4 py-3 text-sm font-semibold text-ink">{r.type}</td>
                <td className="px-4 py-3 text-sm text-ink-ghost">{r.from}</td>
                <td className="px-4 py-3 text-sm text-ink-ghost">{r.to}</td>
                <td className="px-4 py-3 text-sm text-ink-soft">{r.days || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${LEAVE_STATUS[r.status]}`}
                  >
                    {r.status}
                  </span>
                </td>
                {isAdmin ? (
                  <td className="px-4 py-3">
                    {r.status === 'Pending' ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          title="Approve"
                          className="cursor-pointer rounded-lg p-2 text-success hover:bg-success-bg"
                          onClick={() => setConfirm({ type: 'approve', leave: r })}
                        >
                          <Check className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          title="Reject"
                          className="cursor-pointer rounded-lg p-2 text-danger hover:bg-danger-bg"
                          onClick={() => setConfirm({ type: 'reject', leave: r })}
                        >
                          <X className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-ghost">—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmActionModal
        open={Boolean(confirm)}
        title={copy.title}
        message={copy.message}
        confirmLabel={copy.label}
        variant={'variant' in copy ? copy.variant : 'primary'}
        loading={submitting}
        onConfirm={() => void runConfirm()}
        onClose={() => !submitting && setConfirm(null)}
      />
    </div>
  );
};
