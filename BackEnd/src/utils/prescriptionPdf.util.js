import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import moment from 'moment';
import PDFDocument from 'pdfkit';
import { PRESCRIPTION_BRANDING } from '../config/prescriptionBranding.config.js';
import { buildIntakeInstructions } from './prescription.util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets', 'prescription');

const TEAL = '#1a9e96';
const TEAL_DARK = '#0d7377';
const INK = '#1a1a1a';
const MUTED = '#555555';
const LINE = '#cccccc';

const assetPath = (filename) => {
  const full = path.join(ASSETS_DIR, filename);
  return fs.existsSync(full) ? full : null;
};

const formatMedicineTime = (medicine) => {
  const custom = medicine.intakeInstructions?.trim();
  if (custom) return custom;
  return buildIntakeInstructions(medicine.timing) || 'As directed';
};

const formatQualifications = (doctor) => {
  const rows = doctor?.qualifications;
  if (!Array.isArray(rows) || !rows.length) return '';
  return rows.map((q) => (q.level && q.level !== 'Other' ? `${q.degree} (${q.level})` : q.degree)).join(', ');
};

const drawHLine = (doc, y, x1 = 40, x2 = 555, color = TEAL, width = 1.5) => {
  doc.save().strokeColor(color).lineWidth(width).moveTo(x1, y).lineTo(x2, y).stroke().restore();
};

const drawSectionHeading = (doc, label, x, y) => {
  doc.save();
  doc.circle(x + 4, y + 6, 3).fill(TEAL);
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(10);
  doc.text(label, x + 14, y);
  const textWidth = doc.widthOfString(label);
  doc.strokeColor(INK).lineWidth(0.75).moveTo(x + 14, y + 12).lineTo(x + 14 + textWidth, y + 12).stroke();
  doc.restore();
  return y + 20;
};

const drawMedicineTable = (doc, medicines, startY) => {
  const tableX = 40;
  const tableW = 515;
  const cols = [
    { label: 'Sr. No', w: 40 },
    { label: 'Medicine Name', w: 155 },
    { label: 'Quantity', w: 55 },
    { label: 'Time', w: 200 },
    { label: 'Total', w: 65 },
  ];

  let y = startY;
  const rowH = 22;
  const headerH = 24;

  doc.save();
  doc.rect(tableX, y, tableW, headerH).fill('#e8f5f3');
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(8.5);
  let cx = tableX + 4;
  cols.forEach((col) => {
    doc.text(col.label, cx, y + 7, { width: col.w - 6, lineBreak: false });
    cx += col.w;
  });
  y += headerH;

  doc.font('Helvetica').fontSize(8.5);
  medicines.forEach((med, index) => {
    const timeText = formatMedicineTime(med);
    const total = med.totalQuantity ?? '—';
    const values = [String(index + 1), med.name, String(med.packQuantity ?? '—'), timeText, String(total)];

    if (index % 2 === 0) {
      doc.rect(tableX, y, tableW, rowH).fill('#fafafa');
    }

    doc.fillColor(INK);
    cx = tableX + 4;
    cols.forEach((col, i) => {
      doc.text(values[i], cx, y + 6, { width: col.w - 6, height: rowH - 4, ellipsis: true });
      cx += col.w;
    });

    doc.strokeColor(LINE).lineWidth(0.5).moveTo(tableX, y + rowH).lineTo(tableX + tableW, y + rowH).stroke();
    y += rowH;
  });

  doc.strokeColor(LINE).lineWidth(0.75).rect(tableX, startY, tableW, y - startY).stroke();
  doc.restore();

  return y + 8;
};

export const buildPrescriptionPdf = ({ prescription, patient, doctor, includeCombination }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 40;
    const contentW = pageW - margin * 2;

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const logoPath = assetPath('clinic-logo.png');
    const footerPath = assetPath('footer-deco.png');
    const branding = PRESCRIPTION_BRANDING;

    // Watermark
    if (logoPath) {
      doc.save();
      doc.opacity(0.06);
      const wmSize = 280;
      doc.image(logoPath, (pageW - wmSize) / 2, (pageH - wmSize) / 2 - 40, {
        width: wmSize,
        height: wmSize,
      });
      doc.opacity(1);
      doc.restore();
    }

    // Header — logo + clinic (left)
    let headerY = margin;
    if (logoPath) {
      doc.image(logoPath, margin, headerY, { width: 72, height: 72 });
    }

    doc.fillColor(TEAL_DARK).font('Helvetica-Bold').fontSize(13);
    doc.text(branding.clinicName, margin + (logoPath ? 82 : 0), headerY + 8, { width: 220 });

    doc.fillColor(MUTED).font('Helvetica').fontSize(9);
    doc.text(branding.clinicTagline, margin + (logoPath ? 82 : 0), headerY + 28, { width: 220 });

    // Header — doctor (right)
    const doctorName = (doctor?.name || prescription.doctorName || 'Doctor').toUpperCase();
    const qualText = formatQualifications(doctor);
    const regNo = doctor?.registrationNumber?.trim();

    doc.fillColor(INK).font('Helvetica-Bold').fontSize(14);
    doc.text(doctorName, margin, headerY + 4, { width: contentW, align: 'right' });

    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    if (doctor?.title?.trim()) {
      doc.text(doctor.title.trim(), margin, doc.y, { width: contentW, align: 'right' });
    }
    if (qualText) {
      doc.text(qualText, margin, doc.y + 2, { width: contentW, align: 'right' });
    }
    if (regNo) {
      doc.font('Helvetica-Bold').fillColor(INK);
      doc.text(`Reg No: ${regNo}`, margin, doc.y + 2, { width: contentW, align: 'right' });
    }

    let y = Math.max(headerY + 78, doc.y + 12);
    drawHLine(doc, y);
    y += 14;

    // Patient block
    const dateStr = moment(prescription.createdAt).format('DD-MM-YYYY');
    const patientName = patient.name || '—';
    const ageStr = patient.age != null ? String(patient.age) : '—';
    const sexStr = patient.gender || 'Not recorded';

    doc.font('Helvetica').fontSize(10).fillColor(INK);
    doc.text(`Patient Name: `, margin, y, { continued: true });
    doc.font('Helvetica-Bold').text(patientName, { continued: true });
    doc.font('Helvetica').text(`     Age: `, { continued: true });
    doc.font('Helvetica-Bold').text(ageStr, { continued: true });
    doc.font('Helvetica').text(`     Date: `, { continued: true });
    doc.font('Helvetica-Bold').text(dateStr);

    y = doc.y + 6;
    doc.font('Helvetica').text(`Sex: `, margin, y, { continued: true });
    doc.font('Helvetica-Bold').text(sexStr);

    y = doc.y + 10;
    drawHLine(doc, y, margin, pageW - margin, LINE, 0.75);
    y += 14;

    // Diagnosis
    if (prescription.diagnosis?.trim()) {
      y = drawSectionHeading(doc, 'DIAGNOSIS', margin, y);
      doc.font('Helvetica').fontSize(10).fillColor(INK).text(prescription.diagnosis.trim(), margin + 14, y, {
        width: contentW - 14,
      });
      y = doc.y + 12;
    }

    // Medicines table
    if (prescription.medicines?.length) {
      y = drawSectionHeading(doc, 'MEDICINES', margin, y);
      y = drawMedicineTable(doc, prescription.medicines, y);
    }

    // Churan
    if (prescription.churans?.length) {
      y = drawSectionHeading(doc, 'CHURAN', margin, y);
      doc.font('Helvetica').fontSize(9.5).fillColor(INK);
      prescription.churans.forEach((row, index) => {
        doc.font('Helvetica-Bold').text(`${index + 1}. ${row.name}`, margin + 14, y);
        y = doc.y + 2;
        doc.font('Helvetica');
        const powderRows = row.powders?.filter((p) => p?.name?.trim()) ?? [];
        if (powderRows.length) {
          powderRows.forEach((p) => {
            doc.text(`  • ${p.name} — ${p.quantityGrams}g`, margin + 28, y);
            y = doc.y + 2;
          });
        } else if (row.combination?.trim()) {
          doc.text(`Mix: ${row.combination.trim()}`, margin + 28, y);
          y = doc.y + 2;
        }
        if (row.howToIntake?.trim()) {
          doc.text(`Intake: ${row.howToIntake.trim()}`, margin + 28, y);
          y = doc.y + 2;
        }
        y += 4;
      });
      y += 6;
    }

    // Remark
    if (prescription.remarks?.trim()) {
      y = drawSectionHeading(doc, 'REMARK', margin, y);
      doc.font('Helvetica').fontSize(10).fillColor(INK).text(prescription.remarks.trim(), margin + 14, y, {
        width: contentW - 14,
      });
    }

    // Footer area — fixed near bottom
    const footerBarH = 28;
    const footerTop = pageH - margin - 90;

    drawHLine(doc, footerTop, margin, pageW - margin, TEAL, 1.5);

    if (footerPath) {
      doc.image(footerPath, margin, footerTop + 8, { width: 130, height: 55 });
    }

    const contactX = margin + 150;
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED);
    doc.text(`Address: ${branding.address}`, contactX, footerTop + 14, { width: contentW - 160 });
    doc.text(`Phone: ${branding.phones.join(', ')}`, contactX, doc.y + 4, { width: contentW - 160 });

    // Timings bar
    const barY = pageH - margin - footerBarH;
    doc.save();
    doc.rect(margin, barY, contentW, footerBarH).fill(TEAL);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
    doc.text(`Timings: ${branding.timings}`, margin + 10, barY + 9, {
      width: contentW - 20,
      align: 'center',
    });
    doc.restore();

    doc.end();
  });
