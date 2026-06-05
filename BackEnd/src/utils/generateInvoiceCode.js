import HmsInvoice from '../models/hmsInvoice.model.js';

export const generateInvoiceCode = async () => {
  const last = await HmsInvoice.findOne({ invoiceCode: { $regex: /^INV-\d{4}$/ } })
    .sort({ invoiceCode: -1 })
    .select('invoiceCode')
    .lean();

  let seq = 1;
  if (last?.invoiceCode) {
    const match = last.invoiceCode.match(/^INV-(\d{4})$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }

  return `INV-${String(seq).padStart(4, '0')}`;
};
