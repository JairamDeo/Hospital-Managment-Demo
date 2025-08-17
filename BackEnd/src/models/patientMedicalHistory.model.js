import { Schema , model } from 'mongoose';
c

const medicalHistorySchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },

  records: [
    {
      diseaseName: { type: String, required: true }, // e.g., "Diabetes", "Hypertension"
      diagnosedDate: { type: Date },                 // When the condition was diagnosed

      status: {
        type: String,
        enum: ['ongoing', 'recovered', 'chronic',],
        default: 'ongoing'
      },
      severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
            default: 'mild'
        },

      medications: [
        {
          medicineName: { type: String, required: true },   // e.g., "Metformin"
          dosage: { type: String },                         // e.g., "500mg twice a day"
          startDate: { type: Date },
          endDate: { type: Date },                          // optional for ongoing meds
          notes: { type: String }
        }
      ],
      attachments: [
        {
          fileName: { type: String },                      // e.g., "xray.jpg"
          fileType: { type: String },                      // e.g., "image/jpeg"
          fileUrl: { type: String },                       // URL to the file
          uploadedAt: { type: Date, default: Date.now }   // When the file was uploaded
        }
      ],
      notes: { type: String } // Additional comments from doctor/admin
    }
  ],

  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default model('PatientMedicalHistory', medicalHistorySchema);
