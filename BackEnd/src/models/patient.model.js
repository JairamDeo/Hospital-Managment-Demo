import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';


const patientSchema = new Schema({
  patientCode: { type: String, unique: true, required: true },    
  name: { type: String,  },
  dob: { type: Date},
  age: { type: Number },
  city: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']},
  mobileNumber: { type: String, required: true },
  email:{ type: String },
  address: { type: String },
  otp : { type: Number },
  otpExpiresAt:{type:Date},
  password: { type: String},    
  status: { type: Boolean, default: false },
  physicalMeasurements:[ {
    height: { type: Number }, // in cm
    weight: { type: Number }, // in kg
    biceps: { type: Number }, // in cm
    waist: { type: Number }, // in cm
    hips: { type: Number }, // in cm
    BMI: { type: Number }, // Body Mass Index
    WHR: { type: Number }, // Waist-Hip Ratio
    latest: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  generalExamination:[ {
    temperature: { type: Number }, // in Celsius
    pulseRate: { type: Number }, // beats per minute
    respirationRate: { type: Number }, // breaths per minute
    bloodPressure: { type: String }, // e.g., "120/80"
    createdAt: { type: Date, default: Date.now }
  }],
  ayurvedicExamination: {
    naddi: { type: String, enum: ['Vata', 'Pitta', 'Kapha', 'Tridosha'] }, 
    jivha: { type: String, enum: ['Vata', 'Pitta', 'Kapha', 'Tridosha'] }, 
    stool: { type: String, enum: ['Tikshna', 'Manda', 'Ushna', 'Sama'] }, 
    urine: { type: String, enum: ['Tikshna', 'Manda', 'Ushna', 'Sama'] },
    hunger: { type: String, enum: ['Normal', 'Increased', 'Decreased'] },
    digestion: { type: String, enum: ['Normal', 'Good', 'Poor'] },
    sleep: { type: String, enum: ['Normal', 'Good', 'Poor'] },
    intolerance: { type: String, enum: ['Normal', 'Good', 'Poor'] },
    prakurti: { type: String, enum: ['Vata', 'Pitta', 'Kapha', 'Tridosha'] }, // Body constitution
  },
  eatingHabits: {
    dietType: { type: String, enum: ['Vegetarian', 'Non-Vegetarian', 'Vegan','Eggitarian'] },
    mealFrequency: { type: String, enum: ['1 meals', '2 meals', '3 meals', '4 meals', '5 meals'] }, // e.g., 3 meals, 5 meals, etc.
    foodAllergies: { type: String }, // e.g., "Nuts, Dairy"
    favoriteFoods: { type: String }, // e.g., "Pizza, Pasta"
    dislikesFoods: { type: String }, // e.g., "Broccoli, Spinach"
  },
  physicalActivity: {
    exerciseFrequency: { type: String, enum: ['Daily', 'Weekly', 'Monthly', 'Rarely'] }, // e.g., Daily, Weekly, etc.
    preferredActivities: { type: String }, // e.g., "Running, Yoga"
    work_type: { type: String, enum: ['Desk Job', 'Field Job', 'Mixed'] }, // e.g., Desk Job, Field Job, etc.
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add method to compare passwords
patientSchema.methods.comparePassword = async function (password) {
  
  return bcrypt.compare(password, this.password);
};

export default model('Patient', patientSchema);