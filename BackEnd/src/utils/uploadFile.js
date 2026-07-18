import { uploadHmsFile } from '../services/cloudinary.service.js';

/**
 * Upload file buffer to Cloudinary and return a public HTTPS URL.
 * Local /upload folder is not used.
 */
export const uploadFile = async (file, { folder = 'HMS/lab/reports' } = {}) => {
  if (!file || !file.buffer) {
    throw new Error('Invalid file data');
  }

  const result = await uploadHmsFile(file.buffer, {
    folder,
    originalName: file.originalname || 'report',
    mimeType: file.mimetype || '',
  });

  if (!result?.secure_url) {
    throw new Error('Cloudinary upload failed — no URL returned');
  }

  return result.secure_url;
};

export default { uploadFile };
