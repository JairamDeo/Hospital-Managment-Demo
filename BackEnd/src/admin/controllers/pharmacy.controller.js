import { customResponse } from '../../utils/response.js';
import { ErrorMessages, PHARMACY_MESSAGES } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import {
  createPharmacyItem,
  getPharmacyOverview,
  listPharmacyItemsForBilling,
} from '../services/pharmacy.service.js';
import {
  exportPharmacyCsv,
  exportPharmacyPdf,
  getPharmacyImportTemplate,
  importPharmacyCsv,
} from '../services/pharmacyImportExport.service.js';

const sendFile = (res, { buffer, filename, mimeType }) => {
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(buffer);
};

export const getPharmacy = async (req, res) => {
  try {
    const overview = await getPharmacyOverview(req.query);
    return customResponse(res, PHARMACY_MESSAGES.OVERVIEW_FETCHED, 200, overview);
  } catch (error) {
    logger.error('Pharmacy overview error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getPharmacyBillingItems = async (_req, res) => {
  try {
    const items = await listPharmacyItemsForBilling();
    return customResponse(res, PHARMACY_MESSAGES.BILLING_ITEMS_FETCHED, 200, { items });
  } catch (error) {
    logger.error('Pharmacy billing items error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postPharmacyItem = async (req, res) => {
  try {
    const item = await createPharmacyItem(req.body);
    const overview = await getPharmacyOverview({ page: 1, limit: 10, search: '' });
    return customResponse(res, PHARMACY_MESSAGES.ITEM_CREATED, 201, { item, ...overview });
  } catch (error) {
    if (
      error.message === PHARMACY_MESSAGES.CATEGORY_NOT_FOUND ||
      error.message === PHARMACY_MESSAGES.CATEGORY_INACTIVE ||
      error.message === PHARMACY_MESSAGES.UNIT_NOT_FOUND ||
      error.message === PHARMACY_MESSAGES.UNIT_INACTIVE ||
      /manufacturing date|expiry date|best before/i.test(String(error.message ?? ''))
    ) {
      return customResponse(res, error.message, 400);
    }
    logger.error('Create pharmacy item error:', error);
    return customResponse(
      res,
      resolveApiErrorMessage(error, 'Could not add item. Check the form and try again.'),
      500
    );
  }
};

export const downloadPharmacyCsv = async (_req, res) => {
  try {
    const file = await exportPharmacyCsv();
    return sendFile(res, file);
  } catch (error) {
    logger.error('Pharmacy CSV export error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const downloadPharmacyPdf = async (_req, res) => {
  try {
    const file = await exportPharmacyPdf();
    return sendFile(res, file);
  } catch (error) {
    logger.error('Pharmacy PDF export error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const downloadPharmacyImportTemplate = async (_req, res) => {
  try {
    const file = getPharmacyImportTemplate();
    return sendFile(res, file);
  } catch (error) {
    logger.error('Pharmacy template error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const postPharmacyImport = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return customResponse(res, PHARMACY_MESSAGES.IMPORT_INVALID_FILE, 400);
    }
    const summary = await importPharmacyCsv(req.file.buffer);
    const overview = await getPharmacyOverview({ page: 1, limit: 10, search: '' });
    return customResponse(res, PHARMACY_MESSAGES.IMPORT_COMPLETED, 200, { summary, ...overview });
  } catch (error) {
    if (
      error.message === PHARMACY_MESSAGES.IMPORT_EMPTY ||
      error.message === PHARMACY_MESSAGES.IMPORT_INVALID_HEADERS ||
      error.message === PHARMACY_MESSAGES.IMPORT_INVALID_FILE
    ) {
      return customResponse(res, error.message, 400);
    }
    logger.error('Pharmacy import error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};
