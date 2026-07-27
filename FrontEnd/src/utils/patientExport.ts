import type { Patient } from '@/types/patient.types';

export const exportPatientsCsv = (patients: Patient[], filename = 'patients.csv') => {
  const headers = [
    'Patient ID',
    'Name',
    'Prakriti',
    'Age',
    'Last Visit',
    'Treatment',
    'Status',
    'Mobile',
    'Email',
  ];
  const rows = patients.map((p) =>
    [p.id, p.name, p.prakriti, p.age, p.lastVisit, p.treatment, p.status, p.mobile ?? '', p.email ?? '']
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportPatientsPdf = (patients: Patient[]) => {
  const rows = patients
    .map(
      (p) => `
      <tr>
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.prakriti}</td>
        <td>${p.age}</td>
        <td>${p.lastVisit}</td>
        <td>${p.treatment}</td>
        <td>${p.status}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html><head><title>Patient Registry</title>
<style>
  body { font-family: "Plus Jakarta Sans", system-ui, sans-serif; padding: 24px; color: #162820; }
  h1 { color: #1e5c47; font-size: 20px; margin-bottom: 4px; }
  p { color: #587569; font-size: 12px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; padding: 8px; background: #eef7f2; color: #587569; border-bottom: 1px solid #ddeee6; }
  td { padding: 8px; border-bottom: 1px solid #ddeee6; }
</style></head><body>
  <h1>Patient Registry — Ayurveda Health</h1>
  <p>Exported ${new Date().toLocaleString()} · ${patients.length} records</p>
  <table>
    <thead><tr>
      <th>ID</th><th>Name</th><th>Prakriti</th><th>Age</th><th>Last Visit</th><th>Treatment</th><th>Status</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
};
