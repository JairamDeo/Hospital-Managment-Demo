import { Schema, model } from 'mongoose';

const roomMasterSchema = new Schema(
  {
    code: { type: String, unique: true, required: true, trim: true },
    roomNumber: { type: String, required: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    roomType: {
      type: String,
      enum: ['IPD', 'Panchakarma'],
      required: true,
    },
    capacity: { type: Number, required: true, min: 1, default: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomMasterSchema.index({ roomType: 1, active: 1 });

export default model('RoomMaster', roomMasterSchema);
