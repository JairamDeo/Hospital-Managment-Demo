import { Schema, model } from 'mongoose';


const doctorSchema = new Schema({
  registrationNo: { type: String, unique: true, required: true },
  speslisation: { type: String, required: true },
  consultionFeeFirst: { type: Number, required: true },
  consultionFeeFollowup: { type: Number, required: true },  
  experience: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  noPateintchecked: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },      
  createdAt: { type: Date, default: Date.now }
});


export default model('Doctor', doctorSchema);