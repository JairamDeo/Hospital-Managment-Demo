import moment from 'moment';

export const formatPatientPrescription = (doc) => {
  const p = doc.toObject ? doc.toObject() : { ...doc };
  return {
    _id: String(p._id),
    id: String(p._id),
    patientCode: p.patientCode,
    title: p.title || p.fileName,
    fileName: p.fileName,
    mimeType: p.mimeType,
    bytes: p.bytes ?? 0,
    sizeLabel: formatBytes(p.bytes),
    url: p.cloudinaryUrl,
    cloudinaryPublicId: p.cloudinaryPublicId,
    cloudinaryFolder: p.cloudinaryFolder,
    uploadedAt: p.createdAt ? moment(p.createdAt).format('DD MMM YYYY, hh:mm A') : '',
    createdAt: p.createdAt,
  };
};

const formatBytes = (bytes) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};
