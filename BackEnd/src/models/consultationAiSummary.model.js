import { Schema, model } from 'mongoose';

const suggestionSchema = new Schema(
  {
    name: { type: String, default: '' },
    reason: { type: String, default: '' },
    priority: { type: String, default: '' },
  },
  { _id: false }
);

const medicineSuggestionSchema = new Schema(
  {
    name: { type: String, default: '' },
    type: { type: String, default: '' },
    rationale: { type: String, default: '' },
    caution: { type: String, default: '' },
  },
  { _id: false }
);

const localizedContentSchema = new Schema(
  {
    clinicalSummary: { type: String, default: '' },
    chiefComplaint: { type: String, default: '' },
    assessment: { type: String, default: '' },
    historyConsidered: { type: [String], default: [] },
    suggestedTests: { type: [suggestionSchema], default: [] },
    suggestedMedicines: { type: [medicineSuggestionSchema], default: [] },
    redFlags: { type: [String], default: [] },
    followUpAdvice: { type: String, default: '' },
    disclaimer: { type: String, default: '' },
  },
  { _id: false }
);

const consultationAiSummarySchema = new Schema(
  {
    summaryCode: { type: String, required: true, unique: true, index: true },
    patientCode: { type: String, required: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: 'HmsPatient' },
    appointmentCode: { type: String, default: '' },
    doctorStaffCode: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    discussionSource: {
      type: String,
      enum: ['sample', 'manual', 'transcript'],
      default: 'sample',
    },
    sampleId: { type: String, default: '' },
    discussionText: { type: String, required: true },
    model: { type: String, default: '' },
    /** en | hi | both — what the doctor requested */
    outputLanguage: {
      type: String,
      enum: ['en', 'hi', 'both'],
      default: 'both',
    },
    // English (primary / backward compatible flat fields)
    clinicalSummary: { type: String, default: '' },
    chiefComplaint: { type: String, default: '' },
    assessment: { type: String, default: '' },
    historyConsidered: { type: [String], default: [] },
    suggestedTests: { type: [suggestionSchema], default: [] },
    suggestedMedicines: { type: [medicineSuggestionSchema], default: [] },
    redFlags: { type: [String], default: [] },
    followUpAdvice: { type: String, default: '' },
    disclaimer: { type: String, default: '' },
    /** Hindi pack from @vitalets/google-translate-api */
    contentHi: { type: localizedContentSchema, default: () => ({}) },
    rawJson: { type: Schema.Types.Mixed, default: {} },
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      candidatesTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    createdBy: {
      type: { type: String, default: '' },
      staffCode: { type: String, default: '' },
      name: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export default model('ConsultationAiSummary', consultationAiSummarySchema);
