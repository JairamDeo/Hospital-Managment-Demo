/**
 * Patient visibility is controlled by RBAC module access (`patients`),
 * not by appointment/therapy assignment.
 * Returns null = no patient-code filter (full list).
 */
export const getStaffScopedPatientCodes = async (_staff) => null;

/** No per-patient staff lock — module permission is enough. */
export const assertStaffCanAccessPatient = async (_req, _patientCode) => {};
