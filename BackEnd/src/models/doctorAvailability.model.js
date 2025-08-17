import { Schema, model } from 'mongoose';


const doctorAvailabilitySchema = new Schema({
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true }, 
  // Example: { day: "Monday", slots: ["10-2", "6-8"] }
  weeklyAvailability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    slots: [{
      type: String,
      required: true
    }]
  }],        
  createdAt: { type: Date, default: Date.now },
updatedAt: { type: Date, default: Date.now }  

});


export default model('DoctorAvailability', doctorAvailabilitySchema);
