/** HMS / admin / {patientCode} / prescription */
export const prescriptionFolderForPatient = (patientCode) => {
  const safeCode = String(patientCode ?? '')
    .trim()
    .replace(/\//g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  return `HMS/admin/${safeCode}/prescription`;
};
