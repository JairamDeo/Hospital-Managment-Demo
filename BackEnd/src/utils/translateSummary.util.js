import { translate } from '@vitalets/google-translate-api';
import axios from 'axios';
import { getGeminiConfig, isGeminiConfigured } from '../config/gemini.config.js';
import { logger } from './logger.js';

const translateText = async (text, to = 'hi') => {
  const src = String(text ?? '').trim();
  if (!src) return '';
  try {
    const res = await translate(src, { to });
    return res.text || src;
  } catch (err) {
    logger.warn(`Google translate failed: ${err.message}`);
    throw err;
  }
};

const translateList = async (items, to = 'hi') => {
  if (!Array.isArray(items) || !items.length) return [];
  const out = [];
  for (const item of items) {
    out.push(await translateText(String(item), to));
  }
  return out;
};

const emptyLocalized = () => ({
  clinicalSummary: '',
  chiefComplaint: '',
  assessment: '',
  historyConsidered: [],
  suggestedTests: [],
  suggestedMedicines: [],
  redFlags: [],
  followUpAdvice: '',
  disclaimer: '',
});

/** Field-by-field via free Google Translate */
const translateViaGoogle = async (en) => {
  const suggestedTests = [];
  for (const t of en.suggestedTests || []) {
    suggestedTests.push({
      name: await translateText(t.name),
      reason: await translateText(t.reason),
      priority: t.priority || '',
    });
  }

  const suggestedMedicines = [];
  for (const m of en.suggestedMedicines || []) {
    suggestedMedicines.push({
      name: await translateText(m.name),
      type: m.type || '',
      rationale: await translateText(m.rationale),
      caution: await translateText(m.caution),
    });
  }

  return {
    clinicalSummary: await translateText(en.clinicalSummary),
    chiefComplaint: await translateText(en.chiefComplaint),
    assessment: await translateText(en.assessment),
    historyConsidered: await translateList(en.historyConsidered),
    suggestedTests,
    suggestedMedicines,
    redFlags: await translateList(en.redFlags),
    followUpAdvice: await translateText(en.followUpAdvice),
    disclaimer: await translateText(
      en.disclaimer ||
        'AI assist only — doctor must review before any prescription or lab order.'
    ),
  };
};

/** One Gemini call — more reliable when Google Translate is blocked */
const translateViaGemini = async (en) => {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini not configured for Hindi translation');
  }
  const { apiKey, model, baseUrl } = getGeminiConfig();
  const url = `${baseUrl}/models/${encodeURIComponent(model)}:generateContent`;

  const response = await axios.post(
    url,
    {
      systemInstruction: {
        parts: [
          {
            text: `You translate clinical consultation summaries from English to Hindi (Devanagari).
Keep Ayurvedic/medical proper names (Madhumeha, Agni, HbA1c, etc.) and medicine brand/formulation names in Latin script where doctors expect them.
Return ONLY valid JSON with the same keys and array/object shapes as the input. No markdown.`,
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Translate this JSON to Hindi:\n${JSON.stringify(en)}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    },
    {
      params: { key: apiKey },
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      timeout: 90000,
    }
  );

  const text =
    response.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  const raw = String(text || '').trim();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini Hindi translation returned invalid JSON');
    parsed = JSON.parse(match[0]);
  }

  return {
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
    disclaimer: parsed.disclaimer || '',
  };
};

/**
 * Translate a structured AI consultation summary English → Hindi.
 * Tries Google Translate first; falls back to Gemini if blocked/unavailable.
 */
export const translateSummaryToHindi = async (en) => {
  const source = en || emptyLocalized();
  try {
    return await translateViaGoogle(source);
  } catch (googleErr) {
    logger.warn(`Google → Hindi failed, trying Gemini: ${googleErr.message}`);
    try {
      return await translateViaGemini(source);
    } catch (geminiErr) {
      logger.error(`Hindi translation failed: ${geminiErr.message}`);
      throw geminiErr;
    }
  }
};
