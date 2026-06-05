import moment from 'moment';
import PharmacyItem from '../models/pharmacyItem.model.js';
import PharmacyUnitMaster from '../models/pharmacyUnitMaster.model.js';
import { parseUnitSizeString } from '../utils/formatPackSize.js';
import { logger } from '../utils/logger.js';
import {
  buildPharmacyPriceLookup,
  PHARMACY_SEED_ITEMS,
  resolveSeedSalePrice,
} from './pharmacySeedDefaults.js';

const FALLBACK_BY_NAME = Object.fromEntries(
  PHARMACY_SEED_ITEMS.map((row) => [row.name, row])
);

const resolveUnitId = (byUnitName, unitName) => {
  if (!unitName) return null;
  const key = unitName.toLowerCase();
  if (byUnitName[key]) return byUnitName[key];
  if (key === 'l' && byUnitName.l) return byUnitName.l;
  if ((key === 'gm' || key === 'gram') && byUnitName.g) return byUnitName.g;
  return null;
};

/** Backfill legacy pharmacy rows (pack/unit, company, shelf-life dates, sale prices). Run via npm run seed. */
export const migratePharmacyItems = async () => {
  const units = await PharmacyUnitMaster.find().lean();
  const byUnitName = Object.fromEntries(units.map((u) => [u.name.toLowerCase(), u._id]));
  const priceLookup = buildPharmacyPriceLookup();

  const items = await PharmacyItem.find().lean();
  let fixed = 0;
  let pricesSet = 0;

  for (const item of items) {
    const fallback = FALLBACK_BY_NAME[item.name];
    const update = {};

    const hasPack =
      item.packQuantity != null && Number.isFinite(Number(item.packQuantity)) && item.unit;

    if (!hasPack) {
      let packQuantity = item.packQuantity;
      let unitName = null;

      if (item.unitSize) {
        const parsed = parseUnitSizeString(item.unitSize);
        if (parsed) {
          packQuantity = parsed.qty;
          unitName = parsed.unit;
        }
      }

      if (packQuantity == null || !unitName) {
        if (fallback) {
          packQuantity = fallback.packQuantity;
          unitName = fallback.unit;
        }
      }

      const unitId = resolveUnitId(byUnitName, unitName);
      if (packQuantity != null && unitId) {
        update.packQuantity = packQuantity;
        update.unit = unitId;
      }
    }

    if (!item.company && fallback?.company) {
      update.company = fallback.company;
    }

    if (!item.manufacturingDate || !item.expiryDate) {
      const months = item.bestBeforeMonths || fallback?.bestBeforeMonths || 24;
      const mfg = moment().subtract(5, 'months').startOf('day').toDate();
      update.manufacturingDate = mfg;
      update.expiryDate = moment(mfg).add(months, 'months').startOf('day').toDate();
      update.bestBeforeMonths = months;
    }

    const needsPrice = item.salePrice == null || Number(item.salePrice) === 0;
    if (needsPrice) {
      update.salePrice = resolveSeedSalePrice(item, priceLookup);
      pricesSet += 1;
    }

    if (Object.keys(update).length === 0) continue;

    await PharmacyItem.updateOne(
      { _id: item._id },
      {
        $set: update,
        $unset: { unitSize: 1 },
      }
    );
    fixed += 1;
  }

  if (fixed > 0) {
    logger.info(`Migrated ${fixed} pharmacy item(s); sale price set on ${pricesSet}`);
  } else if (pricesSet === 0) {
    logger.info('Pharmacy migration: all items already have sale prices');
  }
};
