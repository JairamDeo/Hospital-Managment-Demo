import multer from 'multer';

const MAX_BYTES = 10 * 1024 * 1024;

export const prescriptionPdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname ?? '');
    if (!isPdf) {
      cb(new Error('Only PDF files are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('file');
