import { useCallback, useEffect, useState } from 'react';
import { patientAdminService } from '@/services/patient/patientAdmin.service';
import { hmsToPatient } from '@/utils/patientHelpers';
import type { Patient } from '@/types/patient.types';
import { getApiErrorMessage } from '@/utils/helpers';

export const useAdminPatientsList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await patientAdminService.list();
      setPatients((data.res?.patients ?? []).map(hmsToPatient));
    } catch (err) {
      setError(getApiErrorMessage(err));
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { patients, loading, error, reload };
};
