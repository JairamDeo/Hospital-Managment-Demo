import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronsDownUp, ChevronsUpDown, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StaffActivityItem } from '@/components/staff/detail/StaffActivityItem';
import { staffProfileService } from '@/services/staff/staffProfile.service';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  ACTIVITY_DATE_FILTERS,
  filterActivityByDate,
  type ActivityDateFilter,
} from '@/utils/activityFilter.util';
import type { StaffActivityRecord } from '@/types/staffProfile.types';

interface Props {
  staffCode: string;
  canCheckInOut: boolean;
}

export const StaffActivityPanel = ({ staffCode, canCheckInOut }: Props) => {
  const { showToast } = useToast();
  const [activity, setActivity] = useState<StaffActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<ActivityDateFilter>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await staffProfileService.listActivity(staffCode);
      setActivity(data.res?.activity ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setActivity([]);
    } finally {
      setLoading(false);
    }
  }, [staffCode, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => filterActivityByDate(activity, dateFilter),
    [activity, dateFilter]
  );

  useEffect(() => {
    setExpandedIds(new Set());
  }, [dateFilter]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(filtered.map((r) => r.id)));
  const collapseAll = () => setExpandedIds(new Set());

  const allExpanded = filtered.length > 0 && filtered.every((r) => expandedIds.has(r.id));

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await staffProfileService.checkIn(staffCode);
      showToast('Checked in successfully', 'success');
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await staffProfileService.checkOut(staffCode);
      showToast('Checked out successfully', 'success');
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-ink-soft">Loading activity log…</p>;
  }

  return (
    <div className="space-y-3">
      {canCheckInOut ? (
        <div className="flex flex-wrap gap-2 rounded-lg border border-border-sage bg-cream/30 p-2.5">
          <Button
            className="gap-1.5 px-3 py-1.5 text-xs"
            onClick={handleCheckIn}
            disabled={actionLoading}
          >
            <LogIn className="h-3.5 w-3.5" strokeWidth={2} />
            Check In
          </Button>
          <Button
            variant="secondary"
            className="gap-1.5 px-3 py-1.5 text-xs"
            onClick={handleCheckOut}
            disabled={actionLoading}
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
            Check Out
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {ACTIVITY_DATE_FILTERS.map((f) => {
            const active = dateFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setDateFilter(f.id)}
                className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  active
                    ? 'border-sage-deep bg-sage-mist text-sage-deep'
                    : 'border-border-sage bg-white text-ink-soft hover:bg-sage-mist/60'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {filtered.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-ghost">
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            </span>
            <button
              type="button"
              onClick={allExpanded ? collapseAll : expandAll}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border-sage bg-white px-2 py-1 text-[11px] font-semibold text-ink-soft hover:bg-sage-mist/50 hover:text-ink"
            >
              {allExpanded ? (
                <>
                  <ChevronsDownUp className="h-3 w-3" strokeWidth={2} />
                  Collapse all
                </>
              ) : (
                <>
                  <ChevronsUpDown className="h-3 w-3" strokeWidth={2} />
                  Expand all
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft">
          {activity.length === 0
            ? 'No activity recorded yet.'
            : 'No activity for this period.'}
        </p>
      ) : (
        <div className="space-y-0">
          {filtered.map((record, i) => (
            <StaffActivityItem
              key={record.id}
              record={record}
              isLast={i === filtered.length - 1}
              expanded={expandedIds.has(record.id)}
              onToggle={() => toggleExpanded(record.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
