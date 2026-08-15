import multer from 'multer';

const storage = multer.memoryStorage();

const createUploader = (fieldName) => {
  return multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    },
    fileFilter: (req, file, cb) => {
      // Validate file type
      if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF and image files are allowed'));
      }
    },
  }).single(fieldName); // Accepts fieldName as a parameter
};

export default createUploader;
