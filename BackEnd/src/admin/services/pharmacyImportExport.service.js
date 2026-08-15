import moment from 'moment';
import PharmacyItem from '../../models/pharmacyItem.model.js';
import PharmacyCategoryMaster from '../../models/pharmacyCategoryMaster.model.js';
import PharmacyUnitMaster from '../../models/pharmacyUnitMaster.model.js';
import { PHARMACY_MESSAGES } from '../../utils/constants.js';
import { generatePharmacyItemCode } from '../../utils/generatePharmacyItemCode.js';
import { formatPharmacyItem } from '../../utils/formatPharmacyItem.js';
import { escapeRegex } from '../../utils/pharmacyQuery.util.js';
import { parseCsv, normalizeCsvHeader, IMPORT_CSV_HEADERS } from '../../utils/csvParse.util.js';
import {
  buildPharmacyCsv,
  buildPharmacyImportTemplateCsv,
  buildPharmacyPdf,
  pharmacyExportBaseName,
} from '../../utils/pharmacyExport.util.js';
import { getPharmacyStats } from './pharmacy.service.js';
import { createPharmacyUnit } from './master.service.js';
import { resolvePharmacyDates } from '../../utils/pharmacyDates.util.js';
import { getDefaultPharmacySpoonGrams } from '../../utils/pharmacySpoon.util.js';
import { resolveImportStock } from '../../utils/pharmacyStockUnits.util.js';

const loadAllItems = async () => {
  const defaultSpoonGrams = await getDefaultPharmacySpoonGrams();
  const docs = await PharmacyItem.find({ active: true })
    .populate('category', 'name')
    .populate('unit', 'name')
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((doc) => formatPharmacyItem(doc, { defaultSpoonGrams }));
};

const normalizeCompany = (value) => String(value ?? '').trim();

const resolveCategory = async (name, cache) => {
  const key = name.trim().toLowerCase();
  if (cache.categories.has(key)) return cache.categories.get(key);
  const found = await PharmacyCategoryMaster.findOne({
    name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i'),
    active: true,
  });
  if (!found) throw new Error(`Category "${name}" not found in Master Data`);
  cache.categories.set(key, found._id);
  return found._id;
};

const resolveUnit = async (name, cache, { createIfMissing = false } = {}) => {
  const trimmed = name.trim();
  const key = trimmed.toLowerCase();
  if (cache.units.has(key)) return cache.units.get(key);
  let found = await PharmacyUnitMaster.findOne({
    name: new RegExp(`^${escapeRegex(trimmed)}$`, 'i'),
    active: true,
  });
  if (!found && key === 'gm') {
    found = await PharmacyUnitMaster.findOne({ name: /^g$/i, active: true });
  }
  if (!found && createIfMissing) {
    try {
      found = await createPharmacyUnit(trimmed);
    } catch (err) {
      found = await PharmacyUnitMaster.findOne({
        name: new RegExp(`^${escapeRegex(trimmed)}$`, 'i'),
        active: true,
      });
      if (!found) throw err;
    }
  }
  if (!found) throw new Error(`Pack unit "${name}" not found in Master Data`);
  cache.units.set(key, found._id);
  return found._id;
};

const findExistingItem = async ({ itemCode, name, company }) => {
  const code = itemCode?.trim();
  if (code) {
    const byCode = await PharmacyItem.findOne({ itemCode: code, active: true });
    if (byCode) return byCode;
  }

  const companyNorm = normalizeCompany(company);
  const nameRegex = new RegExp(`^${escapeRegex(name.trim())}$`, 'i');
  const companyRegex = new RegExp(`^${escapeRegex(companyNorm)}$`, 'i');

  return PharmacyItem.findOne({
    active: true,
    name: nameRegex,
    company: companyRegex,
  });
};

const validateImportRow = (row) => {
  if (!row.name?.trim()) throw new Error('Item Name is required');
  if (!row.category?.trim()) throw new Error('Category is required');

  const packUnit = row.packUnit?.trim() || row.itemLabel?.trim();
  if (!packUnit) throw new Error('Pack Unit (or Item Label for single items) is required');

  const stock = Number(row.stock);
  if (row.stock?.toString().trim() === '' || Number.isNaN(stock) || stock < 0) {
    throw new Error('Stock must be a valid number (0 or more)');
  }

  const usage = row.monthlyUsagePercent?.toString().trim();
  let monthlyUsagePercent = 0;
  if (usage) {
    monthlyUsagePercent = Number(usage);
    if (Number.isNaN(monthlyUsagePercent) || monthlyUsagePercent < 0 || monthlyUsagePercent > 100) {
      throw new Error('Monthly Usage % must be between 0 and 100');
    }
  }

  const priceRaw = row.salePrice?.toString().trim();
  let salePrice = null;
  if (priceRaw) {
    salePrice = Number(priceRaw);
    if (Number.isNaN(salePrice) || salePrice < 0) {
      throw new Error('Sale Price must be a number (0 or more)');
    }
  }

  const dates = resolvePharmacyDates({
    manufacturingDate: row.manufacturingDate,
    expiryDate: row.expiryDate,
    bestBeforeMonths: row.bestBeforeMonths,
  });

  return { stock, monthlyUsagePercent, salePrice, packUnit, ...dates };
};

const upsertImportRow = async (row, cache, defaultSpoonGrams) => {
  const { stock, monthlyUsagePercent, salePrice, packUnit, manufacturingDate, expiryDate, bestBeforeMonths } =
    validateImportRow(row);
  const name = row.name.trim();
  const company = normalizeCompany(row.company);
  const categoryId = await resolveCategory(row.category, cache);

  const stockMeta = resolveImportStock(
    {
      itemType: row.itemType,
      packQuantity: row.packQuantity,
      packUnit,
      itemLabel: row.itemLabel,
      stock,
    },
    defaultSpoonGrams
  );

  const unitId = await resolveUnit(packUnit, cache, {
    createIfMissing: stockMeta.itemType === 'unit',
  });

  const existing = await findExistingItem({
    itemCode: row.itemCode,
    name,
    company,
  });

  let effectiveSalePrice = salePrice;
  let priceDefaulted = false;
  if (!existing && effectiveSalePrice === null) {
    effectiveSalePrice = 0;
    priceDefaulted = true;
  }

  const payload = {
    name,
    company,
    category: categoryId,
    itemType: stockMeta.itemType,
    unitsPerPack: stockMeta.unitsPerPack,
    spoonSizeGrams: stockMeta.spoonSizeGrams,
    stockInBaseUnits: stockMeta.stockInBaseUnits,
    packQuantity: stockMeta.packQuantity,
    unit: unitId,
    stock: stockMeta.stock,
    manufacturingDate,
    expiryDate,
    bestBeforeMonths,
    monthlyUsagePercent,
  };

  if (effectiveSalePrice !== null) {
    payload.salePrice = effectiveSalePrice;
  }

  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    return { action: 'updated', itemCode: existing.itemCode, priceDefaulted: false };
  }

  const itemCode = await generatePharmacyItemCode();
  await PharmacyItem.create({ itemCode, ...payload });
  return { action: 'created', itemCode, priceDefaulted };
};

export const exportPharmacyCsv = async () => {
  const [items, stats] = await Promise.all([loadAllItems(), getPharmacyStats()]);
  const generatedAt = moment().format('DD MMM YYYY, hh:mm A');
  const csv = buildPharmacyCsv({ items, stats, generatedAt });
  return {
    buffer: Buffer.from(csv, 'utf-8'),
    filename: `${pharmacyExportBaseName()}.csv`,
    mimeType: 'text/csv; charset=utf-8',
  };
};

export const exportPharmacyPdf = async () => {
  const [items, stats] = await Promise.all([loadAllItems(), getPharmacyStats()]);
  const generatedAt = moment().format('DD MMM YYYY, hh:mm A');
  const buffer = await buildPharmacyPdf({ items, stats, generatedAt });
  return {
    buffer,
    filename: `${pharmacyExportBaseName()}.pdf`,
    mimeType: 'application/pdf',
  };
};

export const getPharmacyImportTemplate = () => ({
  buffer: Buffer.from(buildPharmacyImportTemplateCsv(), 'utf-8'),
  filename: 'pharmacy-import-template.csv',
  mimeType: 'text/csv; charset=utf-8',
});

export const importPharmacyCsv = async (fileBuffer) => {
  const text = fileBuffer.toString('utf-8');
  const { headers, rows } = parseCsv(text);

  if (!rows.length) throw new Error(PHARMACY_MESSAGES.IMPORT_EMPTY);

  const normalizedHeaders = headers.map(normalizeCsvHeader);
  const requiredKeys = ['name', 'category', 'packUnit', 'stock', 'manufacturingDate'];
  if (!requiredKeys.every((k) => normalizedHeaders.includes(k))) {
    throw new Error(PHARMACY_MESSAGES.IMPORT_INVALID_HEADERS);
  }

  const defaultSpoonGrams = await getDefaultPharmacySpoonGrams();
  const cache = { categories: new Map(), units: new Map() };
  const summary = {
    created: 0,
    updated: 0,
    failed: 0,
    priceDefaulted: 0,
    errors: [],
    warnings: [],
  };

  for (const row of rows) {
    if (row.name?.toLowerCase() === 'item name' || row.name?.toLowerCase() === 'summary') continue;
    try {
      const result = await upsertImportRow(row, cache, defaultSpoonGrams);
      if (result.action === 'created') summary.created += 1;
      else summary.updated += 1;
      if (result.priceDefaulted) {
        summary.priceDefaulted += 1;
      }
    } catch (error) {
      summary.failed += 1;
      summary.errors.push({
        line: row._line,
        message: error.message,
      });
    }
  }

  if (summary.priceDefaulted > 0) {
    summary.warnings.push(
      `${summary.priceDefaulted} item(s) imported with ₹0 sale price (add a Sale Price column or edit prices after import).`
    );
  }

  return summary;
};
