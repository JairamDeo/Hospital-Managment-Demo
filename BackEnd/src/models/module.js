import { Schema, model } from 'mongoose';

const moduleSchema = new Schema({
  pageName: { type: String, required: true },
  pageUrl: { type: String, required: true },
  pageCode: { type: String, unique: true, required: true },
  icon: { type: String, required: true },
  activeIcon: { type: String, required: true },
  status: { type: Boolean, default: false },
  displayorder: { type: Number, required: true },
  parentModule: { type: String, default: null },
  parentIcon: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default model('Module', moduleSchema);
