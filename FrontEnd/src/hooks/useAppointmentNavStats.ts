import { useEffect, useState } from 'react';
import { appointmentAdminService } from '@/services/appointment/appointmentAdmin.service';
import { hmsToAppointment } from '@/utils/appointmentHelpers';

const formatCount = (n: number) => (n >= 1000 ? n.toLocaleString('en-IN') : String(n));

/** Upcoming / active appointment count for sidebar badge (doctor-scoped via API). */
export const useAppointmentNavStats = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    appointmentAdminService
      .list()
      .then(({ data }) => {
        if (cancelled) return;
        const rows = (data.res?.appointments ?? []).map(hmsToAppointment);
        const active = rows.filter((a) => a.status !== 'Cancelled');
        setCount(active.length);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { count, badge: count > 0 ? formatCount(count) : undefined };
};
