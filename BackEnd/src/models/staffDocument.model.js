import { Schema, model } from 'mongoose';

const staffDocumentSchema = new Schema({
  staffCode: { type: String, required: true, index: true, trim: true },
  name: { type: String, required: true, trim: true },
  fileType: { type: String, trim: true, default: 'PDF' },
  filePath: { type: String, required: true },
  bytes: { type: Number, default: 0 },
  uploadedBy: {
    type: { type: String, enum: ['admin', 'staff'], default: 'admin' },
    name: { type: String, default: '' },
    adminId: { type: Schema.Types.ObjectId },
    staffCode: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

export default model('StaffDocument', staffDocumentSchema);
