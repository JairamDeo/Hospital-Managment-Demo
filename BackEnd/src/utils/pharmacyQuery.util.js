import mongoose from 'mongoose';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export const parsePharmacyListQuery = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const search = String(query.search ?? '').trim();
  const categoryId = String(query.categoryId ?? '').trim();
  const brand = String(query.brand ?? query.company ?? '').trim();
  const stockRaw = query.stock ?? query.filter ?? 'all';
  const stock = ['all', 'critical', 'low'].includes(stockRaw) ? stockRaw : 'all';
  return { page, limit, search, categoryId, brand, stock };
};

export const stockFilterForStatus = (stock) => {
  if (stock === 'critical') return { stock: { $lte: 100 } };
  if (stock === 'low') return { stock: { $gt: 100, $lte: 250 } };
  return {};
};

export const categoryBrandMatch = ({ categoryId, brand }) => {
  const match = {};
  if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
    match.category = new mongoose.Types.ObjectId(categoryId);
  }
  if (brand) {
    match.company = new RegExp(`^${escapeRegex(brand)}$`, 'i');
  }
  return match;
};

export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
