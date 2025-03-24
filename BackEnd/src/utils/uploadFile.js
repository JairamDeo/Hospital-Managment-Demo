import fs from 'fs';
import path from 'path';


export const uploadFile = async (file) => {
  try {
    if (!file || !file.buffer) {
      throw new Error('Invalid file data');
    }
    
    const uploadsDir = path.join(process.cwd(), '/upload');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, file.buffer); // Write buffer to file

    return `upload/${fileName}`;
  } catch (error) {
    console.error('Error saving file locally:', error);
    throw error;
  }
};

export default { uploadFile }