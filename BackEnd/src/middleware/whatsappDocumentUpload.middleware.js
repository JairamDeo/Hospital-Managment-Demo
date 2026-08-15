import multer from 'multer';

const MAX_BYTES = 10 * 1024 * 1024;

const allowedMime = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const isAllowedFile = (file) => {
  const mime = String(file.mimetype ?? '').toLowerCase();
  if (allowedMime.has(mime)) return true;
  return /\.(pdf|jpe?g|png|webp)$/i.test(file.originalname ?? '');
};

export const whatsappDocumentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedFile(file)) {
      cb(new Error('Only PDF, JPG, PNG, or WEBP files are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('file');
