import { Schema, model } from 'mongoose';

const userAccessSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  moduleId: {type: Schema.Types.ObjectId, ref: 'Module', required: true },
  read: { type: Boolean, default: false },
  write: { type: Boolean, default: false }
});

export default model('UserAccess', userAccessSchema);
