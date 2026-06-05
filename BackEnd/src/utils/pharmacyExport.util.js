import moment from 'moment';
import PDFDocument from 'pdfkit';
import { escapeCsvCell } from './csvParse.util.js';
import { IMPORT_CSV_HEADERS } from './csvParse.util.js';
import { formatDisplayDate } from './pharmacyDates.util.js';

export const pharmacyExportBaseName = () =>
  `pharmacy-data-${moment().format('DD-MMM-YY')}`;

const INVENTORY_HEADERS = [
  'Item Code',
  'Item Name',
  'Company',
  'Category',
  'Pack Size',
  'Stock',
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
    lines.push(
      [
        item.itemCode,
        item.name,
        item.company ?? '',
        item.category,
        item.unitSize,
        item.stock,
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
  const sample = [
    '',
    'Brahmi Oil',
    'Dabur India',
    'Medicated Oil',
    '200',
    'ml',
    '100',
    formatDisplayDate(new Date()),
    '',
    '24',
    '80',
    '450',
  ];
  return `${IMPORT_CSV_HEADERS.map(escapeCsvCell).join(',')}\n${sample.map(escapeCsvCell).join(',')}\n`;
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

    const colWidths = [58, 72, 58, 58, 42, 28, 52, 52, 36, 38, 32, 36];
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
      drawRow([
        item.itemCode,
        item.name,
        item.company ?? '—',
        item.category,
        item.unitSize,
        item.stock,
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
