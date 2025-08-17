import { Schema, model } from 'mongoose';

const contactSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  phone: { type: String, required: true },
  subject: { type: String, required: true},
  attachment: { type: String },
  type: { type: String, enum: ['inquiry', 'feedback', 'complaint'], default: 'inquiry' },
  status: { type: String, enum: ['new', 'in-progress', 'resolved', 'closed'], default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

export default model('Contact', contactSchema);
