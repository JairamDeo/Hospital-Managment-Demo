import moment from 'moment';
import PDFDocument from 'pdfkit';
import { escapeCsvCell } from './csvParse.util.js';
import { IMPORT_CSV_HEADERS } from './csvParse.util.js';
import { formatDisplayDate } from './pharmacyDates.util.js';

export const pharmacyExportBaseName = () =>
  `pharmacy-data-${moment().format('DD-MMM-YY')}`;

const itemTypeLabel = (type) => {
  switch (type) {
    case 'strip':
      return 'Box';
    case 'weight':
      return 'Powder / Churan';
    default:
      return 'Single item';
  }
};

const INVENTORY_HEADERS = [
  'Item Code',
  'Item Name',
  'Company',
  'Category',
  'Item Type',
  'Units Per Pack',
  'Pack Unit',
  'Stock Display',
  'Manufacturing Date',
  'Expiry Date',
  'Best Before Months',
  'Status',
  'Monthly Usage %',
  'Sale Price (₹)',
];

export const buildPharmacyCsv = ({ items, stats, generatedAt }) => {
  const lines = [];
  lines.push('Ayurveda Hospital — Pharmacy Inventory Export');
  lines.push(`Generated,${escapeCsvCell(generatedAt)}`);
  lines.push('');
  lines.push('Summary');
  lines.push(`Total Items,${stats.totalItems}`);
  lines.push(`Low Stock,${stats.lowStock}`);
  lines.push(`Critical,${stats.critical}`);
  lines.push('');
  lines.push(INVENTORY_HEADERS.map(escapeCsvCell).join(','));

  for (const item of items) {
    const unitName = item.unitSize?.replace(/^[\d.]+\s*/, '') ?? '';
    lines.push(
      [
        item.itemCode,
        item.name,
        item.company ?? '',
        item.category,
        itemTypeLabel(item.itemType),
        item.unitsPerPack ?? item.packQuantity,
        unitName,
        item.stockDisplay ?? item.stock,
        item.manufacturingDate,
        item.expiryDate,
        item.bestBeforeMonths ?? '',
        item.status,
        item.monthlyUsagePercent ?? 0,
        item.salePrice ?? 0,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  return `${lines.join('\n')}\n`;
};

export const buildPharmacyImportTemplateCsv = () => {
  const mfg = formatDisplayDate(new Date());
  const samples = [
    [
      '',
      'Brahmi Oil',
      'Dabur India',
      'Medicated Oil',
      'Single item',
      '1',
      'bottle',
      '50',
      mfg,
      '',
      '24',
      '80',
      '450',
    ],
    [
      '',
      'Ghughul Tablet',
      '',
      'Herbal Formula',
      'Box',
      '30',
      'tablet',
      '10',
      mfg,
      '',
      '12',
      '60',
      '300',
    ],
    [
      '',
      'Ashwagandha Churan',
      'Patanjali',
      'Powder',
      'Powder / Churan',
      '100',
      'g',
      '5',
      mfg,
      '',
      '18',
      '40',
      '500',
    ],
  ];
  const header = IMPORT_CSV_HEADERS.map(escapeCsvCell).join(',');
  const body = samples.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  return `${header}\n${body}\n`;
};

export const buildPharmacyPdf = ({ items, stats, generatedAt }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('Pharmacy Inventory Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#555555').text(`Generated: ${generatedAt}`, { align: 'center' });
    doc.moveDown(1);
    doc.fillColor('#000000');

    doc.fontSize(12).text('Summary', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(10);
    doc.text(`Total items: ${stats.totalItems}`);
    doc.text(`Low stock: ${stats.lowStock}`);
    doc.text(`Critical: ${stats.critical}`);
    doc.moveDown(1);

    doc.fontSize(12).text('Inventory (all records)', { underline: true });
    doc.moveDown(0.5);

    const colWidths = [52, 68, 50, 48, 36, 28, 48, 28, 44, 44, 30, 32, 28, 32];
    const startX = doc.x;
    let y = doc.y;

    const drawRow = (cells, bold = false) => {
      if (y > 720) {
        doc.addPage();
        y = 48;
      }
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7);
      let x = startX;
      cells.forEach((cell, i) => {
        doc.text(String(cell ?? ''), x, y, { width: colWidths[i], lineBreak: false });
        x += colWidths[i];
      });
      y += 14;
      doc.y = y;
    };

    drawRow(INVENTORY_HEADERS, true);

    for (const item of items) {
      const unitName = item.unitSize?.replace(/^[\d.]+\s*/, '') ?? '';
      drawRow([
        item.itemCode,
        item.name,
        item.company ?? '—',
        item.category,
        itemTypeLabel(item.itemType),
        item.unitsPerPack ?? item.packQuantity,
        unitName,
        item.stockDisplay ?? item.stock,
        item.manufacturingDate,
        item.expiryDate,
        item.bestBeforeMonths ?? '—',
        item.status,
        item.monthlyUsagePercent ?? 0,
        item.salePrice ?? 0,
      ]);
    }

    doc.end();
  });
