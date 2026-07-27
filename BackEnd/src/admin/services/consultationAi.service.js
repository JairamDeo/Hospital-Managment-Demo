import axios from 'axios';
import HmsPatient from '../../models/hmsPatient.model.js';
import ConsultationAiSummary from '../../models/consultationAiSummary.model.js';
import { getGeminiConfig, isGeminiConfigured } from '../../config/gemini.config.js';
import { getPatientOverview } from './hmsPatientOverview.service.js';
import { listStructuredPrescriptions } from './hmsStructuredPrescription.service.js';
import { listLabReports } from './hmsLab.service.js';
import { getSampleDiscussion, SAMPLE_CONSULTATIONS } from '../../utils/sampleConsultations.js';
import { translateSummaryToHindi } from '../../utils/translateSummary.util.js';
import { ErrorMessages } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';

export const AI_CONSULT_MESSAGES = {
  GENERATED: 'AI consultation summary generated',
  LIST_FETCHED: 'AI consultation summaries fetched',
  SAMPLES_FETCHED: 'Sample discussions fetched',
  HINDI_READY: 'Hindi summary ready',
  NOT_CONFIGURED:
    'Gemini is not configured. Add GEMINI_API_KEY to BackEnd/.env — see BackEnd/docs/GEMINI_AI_CONSULTATION.md',
  DISCUSSION_REQUIRED: 'Discussion text is required',
  GENERATION_FAILED: 'AI summary generation failed. Please try again.',
  TRANSLATE_FAILED: 'Hindi translation failed. Please try again.',
  SUMMARY_NOT_FOUND: 'AI consultation summary not found',
};

const nextSummaryCode = async () => {
  const count = await ConsultationAiSummary.countDocuments();
  return `AI-SUM-${String(count + 1).padStart(5, '0')}`;
};

const performerFromReq = (req) => {
  if (req?.accountType === 'admin') {
    return { type: 'admin', staffCode: '', name: req.admin?.name || 'Admin' };
  }
  return {
    type: 'staff',
    staffCode: req.staff?.staffCode || '',
    name: req.staff?.name || 'Staff',
  };
};

const trimList = (arr, n = 8) => (Array.isArray(arr) ? arr.slice(0, n) : []);

/** Compact patient EHR context for the model (keeps token use reasonable). */
const buildPatientContext = async (patientCode, req) => {
  const overview = await getPatientOverview(patientCode, req);
  const patient = overview.patient || {};
  const care = overview.care || {};
  const clinical = overview.clinical || {};

  let prescriptions = [];
  try {
    prescriptions = await listStructuredPrescriptions(patientCode);
  } catch {
    prescriptions = [];
  }

  let labReports = [];
  try {
    labReports = await listLabReports({ patientCode });
  } catch {
    labReports = care.labReports || [];
  }

  return {
    demographics: {
      patientCode: patient.patientCode || patientCode,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      prakriti: patient.prakriti,
      treatment: patient.treatment,
      city: patient.city,
    },
    vitals: care.vitals || {},
    recentVitalsHistory: trimList(care.vitalsHistory, 5),
    activeTreatment: care.activeTreatment || null,
    treatmentHistory: trimList(care.treatmentHistory, 5),
    recentAppointments: trimList(care.appointments, 5),
    labReports: trimList(
      (labReports || []).map((r) => ({
        testName: r.testName,
        date: r.date || r.reportDate,
        result: r.result,
        status: r.status,
        lab: r.lab || r.labName,
      })),
      10
    ),
    recentPrescriptions: trimList(
      (prescriptions || []).map((p) => ({
        code: p.prescriptionCode,
        date: p.createdAt,
        diagnosis: p.diagnosis,
        medicines: trimList(p.medicines, 8).map((m) => m.name),
        recommendedTests: trimList(p.recommendedTests, 6).map(
          (t) => t.testName || t.name
        ),
        remarks: p.remarks,
      })),
      5
    ),
    clinicalHighlights: {
      presentComplaints: clinical.presentComplaints || clinical.present_complaints,
      diseaseHistory: clinical.diseaseHistory || clinical.disease_history,
      diabetesHistory: clinical.diabetesHistory || clinical.diabetes_history,
      generalExamination: clinical.generalExamination || clinical.general_examination,
    },
  };
};

const SYSTEM_INSTRUCTION = `You are a clinical decision-support assistant for an Ayurveda + integrative clinic (Panchakarma / Madhumeha / Sandhivata etc.).
You help the doctor with a structured consultation summary. You are NOT a licensed physician and must NEVER claim to prescribe.

Rules:
1. Write the JSON values in clear English medical / Ayurvedic terms (e.g. Madhumeha, Amlapitta, Sandhivata, Agni, Ama). Hindi translation is applied separately.
2. The discussion transcript may be in English, Hindi, or mixed — understand both.
3. Base suggestions on BOTH the discussion transcript AND the patient's existing EHR (labs, prescriptions, vitals, clinical history).
4. Prefer suggesting lab tests that fit the case (FBS, PPBS, HbA1c, TSH, CBC, Lipid, etc.) and note if a similar test already exists in EHR.
5. Medicine suggestions must be SUGGESTIONS only (Ayurvedic formulations or classes preferred); include caution notes. Do not invent exact illegal doses.
6. Flag red flags that need urgent attention.
7. Reply with ONLY valid JSON matching the schema — no markdown fences.`;

const buildUserPrompt = (discussionText, patientContext) => `Patient EHR (JSON):
${JSON.stringify(patientContext, null, 2)}

Doctor–patient discussion transcript:
"""
${discussionText}
"""

Return JSON with exactly these keys:
{
  "clinicalSummary": "3-6 sentence clinical summary in medical terms",
  "chiefComplaint": "short chief complaint",
  "assessment": "provisional assessment / differential in medical terms",
  "historyConsidered": ["bullet points of EHR facts you used"],
  "suggestedTests": [{"name":"test name","reason":"why","priority":"High|Medium|Low"}],
  "suggestedMedicines": [{"name":"name or class","type":"Ayurvedic|Allopathic|Lifestyle","rationale":"why","caution":"warning if any"}],
  "redFlags": ["..."],
  "followUpAdvice": "short follow-up plan",
  "disclaimer": "AI assist only — doctor must review before any prescription or order"
}`;

const extractJson = (text) => {
  const raw = String(text || '').trim();
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(AI_CONSULT_MESSAGES.GENERATION_FAILED);
  }
};

const callGemini = async (discussionText, patientContext) => {
  const { apiKey, model, baseUrl } = getGeminiConfig();
  const url = `${baseUrl}/models/${encodeURIComponent(model)}:generateContent`;

  const response = await axios.post(
    url,
    {
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: buildUserPrompt(discussionText, patientContext) }],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: 'application/json',
      },
    },
    {
      // Auth keys (AQ.*) prefer header; query key also kept for older AIza keys
      params: { key: apiKey },
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      timeout: 90000,
      validateStatus: (s) => s >= 200 && s < 300,
    }
  );

  const text =
    response.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) {
    logger.warn('Gemini empty response', response.data);
    throw new Error(AI_CONSULT_MESSAGES.GENERATION_FAILED);
  }

  const parsed = extractJson(text);
  const usage = response.data?.usageMetadata || {};
  return {
    parsed,
    model,
    tokenUsage: {
      promptTokens: usage.promptTokenCount || 0,
      candidatesTokens: usage.candidatesTokenCount || 0,
      totalTokens: usage.totalTokenCount || 0,
    },
  };
};

const pickLocalized = (doc, lang = 'en') => {
  const hi = doc.contentHi || {};
  const useHi = lang === 'hi' && (hi.clinicalSummary || hi.chiefComplaint);
  if (!useHi) {
    return {
      clinicalSummary: doc.clinicalSummary || '',
      chiefComplaint: doc.chiefComplaint || '',
      assessment: doc.assessment || '',
      historyConsidered: doc.historyConsidered || [],
      suggestedTests: doc.suggestedTests || [],
      suggestedMedicines: doc.suggestedMedicines || [],
      redFlags: doc.redFlags || [],
      followUpAdvice: doc.followUpAdvice || '',
      disclaimer: doc.disclaimer || '',
    };
  }
  return {
    clinicalSummary: hi.clinicalSummary || doc.clinicalSummary || '',
    chiefComplaint: hi.chiefComplaint || doc.chiefComplaint || '',
    assessment: hi.assessment || doc.assessment || '',
    historyConsidered: hi.historyConsidered?.length
      ? hi.historyConsidered
      : doc.historyConsidered || [],
    suggestedTests: hi.suggestedTests?.length ? hi.suggestedTests : doc.suggestedTests || [],
    suggestedMedicines: hi.suggestedMedicines?.length
      ? hi.suggestedMedicines
      : doc.suggestedMedicines || [],
    redFlags: hi.redFlags?.length ? hi.redFlags : doc.redFlags || [],
    followUpAdvice: hi.followUpAdvice || doc.followUpAdvice || '',
    disclaimer: hi.disclaimer || doc.disclaimer || '',
  };
};

const formatSummary = (doc) => {
  const hasHindi = Boolean(
    doc.contentHi?.clinicalSummary || doc.contentHi?.chiefComplaint || doc.contentHi?.assessment
  );
  return {
    _id: String(doc._id),
    summaryCode: doc.summaryCode,
    patientCode: doc.patientCode,
    appointmentCode: doc.appointmentCode || '',
    doctorStaffCode: doc.doctorStaffCode || '',
    doctorName: doc.doctorName || '',
    discussionSource: doc.discussionSource,
    sampleId: doc.sampleId || '',
    discussionText: doc.discussionText,
    model: doc.model,
    outputLanguage: doc.outputLanguage || (hasHindi ? 'both' : 'en'),
    hasHindi,
    // Default English flat fields (backward compatible)
    ...pickLocalized(doc, 'en'),
    contentEn: pickLocalized(doc, 'en'),
    contentHi: hasHindi ? pickLocalized(doc, 'hi') : null,
    tokenUsage: doc.tokenUsage || {},
    createdAt: doc.createdAt,
  };
};

export const listSampleConsultations = () =>
  SAMPLE_CONSULTATIONS.map(({ id, title, discussionText }) => ({
    id,
    title,
    preview: discussionText.slice(0, 160) + '…',
    discussionText,
  }));

export const listConsultationSummaries = async (patientCode) => {
  const rows = await ConsultationAiSummary.find({ patientCode })
    .sort({ createdAt: -1 })
    .limit(20);
  return rows.map(formatSummary);
};

export const generateConsultationSummary = async (patientCode, payload, req) => {
  if (!isGeminiConfigured()) {
    throw new Error(AI_CONSULT_MESSAGES.NOT_CONFIGURED);
  }

  const patient = await HmsPatient.findOne({ patientCode, status: true });
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);

  let discussionSource = 'manual';
  let sampleId = '';
  let discussionText = String(payload.discussionText || '').trim();

  if (!discussionText) {
    const sample = getSampleDiscussion(payload.sampleId);
    discussionText = sample.discussionText;
    discussionSource = 'sample';
    sampleId = sample.id;
  } else if (payload.sampleId) {
    discussionSource = 'sample';
    sampleId = payload.sampleId;
  }

  if (!discussionText) throw new Error(AI_CONSULT_MESSAGES.DISCUSSION_REQUIRED);

  const patientContext = await buildPatientContext(patientCode, req);

  let geminiResult;
  try {
    geminiResult = await callGemini(discussionText, patientContext);
  } catch (err) {
    if (err.message === AI_CONSULT_MESSAGES.NOT_CONFIGURED) throw err;
    const apiMsg =
      err.response?.data?.error?.message ||
      err.message ||
      AI_CONSULT_MESSAGES.GENERATION_FAILED;
    logger.error(`Gemini consultation error: ${apiMsg}`);
    if (/API key|PERMISSION|401|403|not configured/i.test(apiMsg)) {
      throw new Error(AI_CONSULT_MESSAGES.NOT_CONFIGURED);
    }
    if (/no longer available|not found|invalid model|model/i.test(apiMsg)) {
      throw new Error(
        `${AI_CONSULT_MESSAGES.GENERATION_FAILED} (${apiMsg}) Set GEMINI_MODEL=gemini-3.5-flash in .env`
      );
    }
    throw new Error(`${AI_CONSULT_MESSAGES.GENERATION_FAILED} (${apiMsg})`);
  }

  const { parsed, model, tokenUsage } = geminiResult;
  const actor = performerFromReq(req);

  const langRaw = String(payload.language || payload.outputLanguage || 'both').toLowerCase();
  const outputLanguage = ['en', 'hi', 'both'].includes(langRaw) ? langRaw : 'both';

  const enContent = {
    clinicalSummary: parsed.clinicalSummary || '',
    chiefComplaint: parsed.chiefComplaint || '',
    assessment: parsed.assessment || '',
    historyConsidered: Array.isArray(parsed.historyConsidered)
      ? parsed.historyConsidered.map(String)
      : [],
    suggestedTests: Array.isArray(parsed.suggestedTests) ? parsed.suggestedTests : [],
    suggestedMedicines: Array.isArray(parsed.suggestedMedicines)
      ? parsed.suggestedMedicines
      : [],
    redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags.map(String) : [],
    followUpAdvice: parsed.followUpAdvice || '',
    disclaimer:
      parsed.disclaimer ||
      'AI assist only — doctor must review before any prescription or lab order.',
  };

  // Always store Hindi so the EN/HI view toggle works (language picker is preference only).
  let contentHi = null;
  try {
    contentHi = await translateSummaryToHindi(enContent);
  } catch (err) {
    logger.warn(`Hindi translation skipped on generate: ${err.message}`);
    contentHi = null;
  }

  const row = await ConsultationAiSummary.create({
    summaryCode: await nextSummaryCode(),
    patientCode,
    patient: patient._id,
    appointmentCode: payload.appointmentCode || '',
    doctorStaffCode: req.staff?.staffCode || '',
    doctorName: req.staff?.name || actor.name,
    discussionSource,
    sampleId,
    discussionText,
    model,
    outputLanguage: contentHi ? (outputLanguage === 'en' ? 'both' : outputLanguage) : outputLanguage,
    ...enContent,
    contentHi: contentHi || undefined,
    rawJson: parsed,
    tokenUsage,
    createdBy: actor,
  });

  return formatSummary(row);
};

/** Build flat English content from a stored summary document. */
const enFromDoc = (doc) => ({
  clinicalSummary: doc.clinicalSummary || '',
  chiefComplaint: doc.chiefComplaint || '',
  assessment: doc.assessment || '',
  historyConsidered: doc.historyConsidered || [],
  suggestedTests: doc.suggestedTests || [],
  suggestedMedicines: doc.suggestedMedicines || [],
  redFlags: doc.redFlags || [],
  followUpAdvice: doc.followUpAdvice || '',
  disclaimer: doc.disclaimer || '',
});

/**
 * Ensure Hindi exists for an existing summary (on-demand for older EN-only rows).
 */
export const ensureHindiConsultationSummary = async (patientCode, summaryCode) => {
  const row = await ConsultationAiSummary.findOne({ patientCode, summaryCode });
  if (!row) throw new Error(AI_CONSULT_MESSAGES.SUMMARY_NOT_FOUND);

  const already =
    row.contentHi?.clinicalSummary ||
    row.contentHi?.chiefComplaint ||
    row.contentHi?.assessment;
  if (already) return formatSummary(row);

  try {
    const contentHi = await translateSummaryToHindi(enFromDoc(row));
    row.contentHi = contentHi;
    if (row.outputLanguage === 'en') row.outputLanguage = 'both';
    await row.save();
    return formatSummary(row);
  } catch (err) {
    logger.error(`ensureHindi failed: ${err.message}`);
    throw new Error(AI_CONSULT_MESSAGES.TRANSLATE_FAILED);
  }
};
