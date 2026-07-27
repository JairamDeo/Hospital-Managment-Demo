import { customResponse } from '../../utils/response.js';
import { ErrorMessages } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import {
  AI_CONSULT_MESSAGES,
  ensureHindiConsultationSummary,
  generateConsultationSummary,
  listConsultationSummaries,
  listSampleConsultations,
} from '../services/consultationAi.service.js';

export const getAiConsultationSamples = (_req, res) => {
  try {
    const samples = listSampleConsultations();
    return customResponse(res, AI_CONSULT_MESSAGES.SAMPLES_FETCHED, 200, { samples });
  } catch (error) {
    logger.error('AI samples error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getAiConsultationSummaries = async (req, res) => {
  try {
    const summaries = await listConsultationSummaries(req.params.patientCode);
    return customResponse(res, AI_CONSULT_MESSAGES.LIST_FETCHED, 200, { summaries });
  } catch (error) {
    logger.error('AI summaries list error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postAiConsultationSummary = async (req, res) => {
  try {
    const summary = await generateConsultationSummary(
      req.params.patientCode,
      req.body || {},
      req
    );
    return customResponse(res, AI_CONSULT_MESSAGES.GENERATED, 201, { summary });
  } catch (error) {
    const known = [
      AI_CONSULT_MESSAGES.NOT_CONFIGURED,
      AI_CONSULT_MESSAGES.DISCUSSION_REQUIRED,
      AI_CONSULT_MESSAGES.GENERATION_FAILED,
      ErrorMessages.PATIENT_NOT_FOUND,
      ErrorMessages.ACCESS_DENIED,
    ];
    const msg = String(error.message || '');
    if (
      known.includes(msg) ||
      msg.startsWith(AI_CONSULT_MESSAGES.GENERATION_FAILED) ||
      msg.startsWith(AI_CONSULT_MESSAGES.NOT_CONFIGURED)
    ) {
      const status = msg.includes('not configured') || msg.includes('GEMINI_API_KEY') ? 503 : 400;
      return customResponse(res, msg, status);
    }
    logger.error('AI consultation generate error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postAiConsultationHindi = async (req, res) => {
  try {
    const summary = await ensureHindiConsultationSummary(
      req.params.patientCode,
      req.params.summaryCode
    );
    return customResponse(res, AI_CONSULT_MESSAGES.HINDI_READY, 200, { summary });
  } catch (error) {
    const msg = String(error.message || '');
    if (
      msg === AI_CONSULT_MESSAGES.SUMMARY_NOT_FOUND ||
      msg === AI_CONSULT_MESSAGES.TRANSLATE_FAILED
    ) {
      return customResponse(res, msg, msg === AI_CONSULT_MESSAGES.SUMMARY_NOT_FOUND ? 404 : 400);
    }
    logger.error('AI consultation Hindi ensure error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};
