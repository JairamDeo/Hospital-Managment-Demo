import multer from 'multer';

const MAX_BYTES = 15 * 1024 * 1024;

export const labReportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok =
      /pdf|image\/(jpeg|png|jpg|webp)/i.test(file.mimetype) ||
      /\.(pdf|jpe?g|png|webp)$/i.test(file.originalname ?? '');
    if (!ok) {
      cb(new Error('Only PDF or image files are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('file');
