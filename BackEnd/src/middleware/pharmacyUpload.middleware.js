import multer from 'multer';
import { PHARMACY_MESSAGES } from '../utils/constants.js';

const csvFilter = (_req, file, cb) => {
  const name = (file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();
  if (name.endsWith('.csv') || mime === 'text/csv' || mime === 'application/vnd.ms-excel') {
    cb(null, true);
    return;
  }
  cb(new Error(PHARMACY_MESSAGES.IMPORT_INVALID_FILE));
};

export const pharmacyCsvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: csvFilter,
}).single('file');
