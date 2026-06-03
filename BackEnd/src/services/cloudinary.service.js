import axios from 'axios';
import { cloudinary, initCloudinary, isCloudinaryConfigured } from '../config/cloudinary.config.js';
import { prescriptionFolderForPatient } from '../utils/cloudinaryFolders.util.js';

const ensureCloudinary = () => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Add CLOUDINARY_* variables to .env');
  }
  initCloudinary();
};

const safeBaseName = (name) =>
  String(name ?? 'prescription')
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 80) || 'prescription';

export const uploadPrescriptionPdf = async (buffer, { patientCode, originalName }) => {
  ensureCloudinary();
  const folder = prescriptionFolderForPatient(patientCode);
  const publicId = `${Date.now()}_${safeBaseName(originalName)}`;

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw',
        public_id: publicId,
        format: 'pdf',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    upload.end(buffer);
  });
};

export const deleteCloudinaryAsset = async (publicId, resourceType = 'raw') => {
  ensureCloudinary();
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

const cloudinaryAuth = () => ({
  username: process.env.CLOUDINARY_API_KEY,
  password: process.env.CLOUDINARY_API_SECRET,
});

/** Direct secure_url often returns 401; use Admin API + signed URLs. */
export const fetchRawPdfStream = async (publicId, fallbackUrl) => {
  ensureCloudinary();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;

  const attempts = [
    () =>
      axios.get(`https://api.cloudinary.com/v1_1/${cloudName}/raw/download`, {
        params: { public_id: publicId, attachment: false },
        auth: cloudinaryAuth(),
        responseType: 'stream',
        timeout: 60000,
        validateStatus: (status) => status >= 200 && status < 300,
      }),
    () =>
      axios.get(
        cloudinary.utils.private_download_url(publicId, 'pdf', {
          resource_type: 'raw',
          type: 'upload',
          expires_at: expiresAt,
        }),
        {
          responseType: 'stream',
          timeout: 60000,
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 300,
        }
      ),
    () =>
      axios.get(
        cloudinary.url(publicId, {
          resource_type: 'raw',
          type: 'upload',
          sign_url: true,
          secure: true,
        }),
        {
          responseType: 'stream',
          timeout: 60000,
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 300,
        }
      ),
    () =>
      fallbackUrl
        ? axios.get(fallbackUrl, {
            responseType: 'stream',
            timeout: 60000,
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 300,
          })
        : Promise.reject(new Error('No fallback URL')),
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err) {
      lastError = err;
    }
  }

  const message =
    lastError?.response?.status === 401
      ? 'Cloudinary denied access to this PDF. Verify CLOUDINARY_* keys in .env.'
      : lastError?.message || 'Could not fetch PDF from Cloudinary';
  throw new Error(message);
};
