import { useEffect, useState } from 'react';
import { patientAdminService } from '@/services/patient/patientAdmin.service';

const formatCount = (n: number) => (n >= 1000 ? n.toLocaleString('en-IN') : String(n));

export const usePatientNavStats = () => {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    patientAdminService
      .getStats()
      .then(({ data }) => {
        if (!cancelled) setTotal(data.res?.stats?.total ?? 0);
      })
      .catch(() => {
        if (!cancelled) setTotal(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { total, badge: formatCount(total) };
};
