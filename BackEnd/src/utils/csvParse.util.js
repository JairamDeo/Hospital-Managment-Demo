/** Parse a single CSV row respecting quoted fields */
export const parseCsvRow = (line) => {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
};

export const escapeCsvCell = (value) => {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export const parseCsv = (text) => {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length < 2) return { headers: [], rows: [] };

  const headers = parseCsvRow(nonEmpty[0]);
  const rows = nonEmpty.slice(1).map((line, index) => {
    const values = parseCsvRow(line);
    const row = { _line: index + 2 };
    headers.forEach((header, i) => {
      row[normalizeCsvHeader(header)] = values[i] ?? '';
    });
    return row;
  });

  return { headers, rows };
};

const HEADER_ALIASES = {
  itemcode: 'itemCode',
  item_code: 'itemCode',
  code: 'itemCode',
  itemname: 'name',
  item_name: 'name',
  name: 'name',
  company: 'company',
  manufacturer: 'company',
  brand: 'company',
  category: 'category',
  packquantity: 'packQuantity',
  pack_quantity: 'packQuantity',
  quantity: 'packQuantity',
  packunit: 'packUnit',
  pack_unit: 'packUnit',
  unit: 'packUnit',
  stock: 'stock',
  stockunits: 'stock',
  monthlyusage: 'monthlyUsagePercent',
  monthly_usage_percent: 'monthlyUsagePercent',
  usagepercent: 'monthlyUsagePercent',
  manufacturingdate: 'manufacturingDate',
  mfgdate: 'manufacturingDate',
  manufacturing_date: 'manufacturingDate',
  expirydate: 'expiryDate',
  expdate: 'expiryDate',
  expiry_date: 'expiryDate',
  bestbeforemonths: 'bestBeforeMonths',
  best_before_months: 'bestBeforeMonths',
  shelflife: 'bestBeforeMonths',
  shelf_life_months: 'bestBeforeMonths',
  saleprice: 'salePrice',
  sale_price: 'salePrice',
  price: 'salePrice',
  unitprice: 'salePrice',
  unit_price: 'salePrice',
  mrp: 'salePrice',
};

export const normalizeCsvHeader = (header) => {
  const key = String(header)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return HEADER_ALIASES[key] ?? key;
};

export const IMPORT_CSV_HEADERS = [
  'Item Code',
  'Item Name',
  'Company',
  'Category',
  'Pack Quantity',
  'Pack Unit',
  'Stock',
  'Manufacturing Date',
  'Expiry Date',
  'Best Before Months',
  'Monthly Usage %',
  'Sale Price',
];
