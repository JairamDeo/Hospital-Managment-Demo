import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import moment from 'moment';
import PDFDocument from 'pdfkit';
import { PRESCRIPTION_BRANDING } from '../config/prescriptionBranding.config.js';
import { buildIntakeInstructions } from './prescription.util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets', 'prescription');

const TEAL = '#26b0b6';
const TEAL_DARK = '#1a8a8f';
const TEAL_LIGHT = '#a2ded0';
const INK = '#222222';
const MUTED = '#4a4a4a';
const LINE = '#d8d8d8';

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

const drawHLine = (doc, y, x1, x2, color = TEAL, width = 1) => {
  doc.save().strokeColor(color).lineWidth(width).moveTo(x1, y).lineTo(x2, y).stroke().restore();
};

const drawSectionLabel = (doc, label, x, y, { inlineValue = '' } = {}) => {
  doc.save();
  doc.circle(x + 4, y + 6, 3).fill(TEAL);
  const heading = `${label} :`;
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(10);
  const textX = x + 14;
  doc.text(heading, textX, y, { continued: Boolean(inlineValue) });
  const headingW = doc.widthOfString(heading);
  doc.strokeColor(INK).lineWidth(0.6).moveTo(textX, y + 12).lineTo(textX + headingW - 6, y + 12).stroke();
  if (inlineValue) {
    doc.font('Helvetica').text(` ${inlineValue}`);
  }
  doc.restore();
  return doc.y + (inlineValue ? 10 : 6);
};

const drawPinIcon = (doc, x, y, size = 10) => {
  doc.save();
  doc.fillColor(TEAL);
  doc.circle(x + size / 2, y + size / 2 - 1, size / 2 - 1.2).fill();
  doc.fillColor('#ffffff').circle(x + size / 2, y + size / 2 - 1, size / 4.5).fill();
  doc.restore();
};

const drawPhoneIcon = (doc, x, y, w = 10, h = 11) => {
  doc.save();
  doc.strokeColor(TEAL).lineWidth(0.85);
  doc.roundedRect(x + 0.5, y, w - 1, h, 1.8).stroke();
  doc.moveTo(x + w * 0.3, y + h - 1.5).lineTo(x + w * 0.7, y + h - 1.5).stroke();
  doc.restore();
};

const drawClockIcon = (doc, x, y, size = 11) => {
  doc.save();
  doc.strokeColor(TEAL_DARK).lineWidth(0.85);
  doc.circle(x + size / 2, y + size / 2, size / 2 - 0.6).stroke();
  doc.moveTo(x + size / 2, y + size / 2).lineTo(x + size / 2, y + 2.2).stroke();
  doc.moveTo(x + size / 2, y + size / 2).lineTo(x + size - 2.2, y + size / 2 + 1.2).stroke();
  doc.restore();
};

const drawMedicineTable = (doc, medicines, startY) => {
  const tableX = 40;
  const tableW = 515;
  const cols = [
    { label: 'Sr. No', w: 42 },
    { label: 'Medicine Name', w: 158 },
    { label: 'Quantity', w: 52 },
    { label: 'Time', w: 198 },
    { label: 'Total', w: 65 },
  ];

  let y = startY;
  const rowH = 22;
  const headerH = 22;

  doc.save();
  doc.rect(tableX, y, tableW, headerH).fill('#f0f7f6');
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(8.5);
  let cx = tableX + 5;
  cols.forEach((col) => {
    doc.text(col.label, cx, y + 6, { width: col.w - 6, lineBreak: false });
    cx += col.w;
  });
  y += headerH;

  doc.font('Helvetica').fontSize(8.5);
  medicines.forEach((med, index) => {
    const timeText = formatMedicineTime(med);
    const total = med.totalQuantity ?? '—';
    const values = [String(index + 1), med.name, String(med.packQuantity ?? '—'), timeText, String(total)];

    doc.fillColor(INK);
    cx = tableX + 5;
    cols.forEach((col, i) => {
      doc.text(values[i], cx, y + 6, { width: col.w - 6, height: rowH - 4, ellipsis: true });
      cx += col.w;
    });

    doc.strokeColor(LINE).lineWidth(0.5).moveTo(tableX, y + rowH).lineTo(tableX + tableW, y + rowH).stroke();
    y += rowH;
  });

  doc.restore();
  return y + 6;
};

const drawPrescriptionFooter = (doc, { pageW, pageH, branding, footerPath }) => {
  // PDFKit auto-paginates when writing inside the bottom margin — clear margins for footer.
  const m = doc.page.margins;
  const prev = { top: m.top, left: m.left, bottom: m.bottom, right: m.right };
  m.top = 0;
  m.left = 0;
  m.bottom = 0;
  m.right = 0;

  const footerBarH = 26;
  const barY = pageH - footerBarH;
  const footerContentH = 78;
  const footerTop = barY - footerContentH;
  const decoW = 170;
  const decoH = footerContentH;

  // Decorative graphic flush against the left page edge
  if (footerPath) {
    doc.image(footerPath, 0, footerTop, { width: decoW, height: decoH });
  }

  const contactX = decoW + 10;
  drawHLine(doc, footerTop + 12, contactX, pageW - 36, TEAL, 1);

  const iconW = 10;
  const addressY = footerTop + 26;
  drawPinIcon(doc, contactX, addressY, iconW);
  doc.font('Times-Roman').fontSize(9).fillColor(MUTED);
  doc.text(branding.address, contactX + iconW + 7, addressY, {
    width: pageW - contactX - iconW - 44,
    lineBreak: false,
  });

  const phoneY = addressY + 16;
  drawPhoneIcon(doc, contactX, phoneY, iconW, 11);
  doc.text(branding.phones.join(', '), contactX + iconW + 7, phoneY, {
    width: pageW - contactX - iconW - 44,
    lineBreak: false,
  });

  doc.save();
  doc.rect(0, barY, pageW, footerBarH).fill(TEAL_LIGHT);
  drawClockIcon(doc, 36, barY + 7, 11);
  doc.fillColor(TEAL_DARK).font('Helvetica-Bold').fontSize(8.5);
  doc.text(`Timings: ${branding.timings}`, 54, barY + 9, {
    width: pageW - 70,
    align: 'center',
    lineBreak: false,
  });
  doc.restore();

  m.top = prev.top;
  m.left = prev.left;
  m.bottom = prev.bottom;
  m.right = prev.right;
};

const FOOTER_RESERVED = 110;

const drawPrescriptionHeader = (doc, { pageW, margin, contentW, branding, doctor, prescription, headerBrandPath, logoPath }) => {
  const headerY = margin;
  const leftBrandW = 128;

  if (headerBrandPath) {
    doc.image(headerBrandPath, margin, headerY, { width: leftBrandW, height: 88 });
  } else if (logoPath) {
    doc.image(logoPath, margin, headerY, { width: 58, height: 58 });
    doc.fillColor(TEAL).font('Helvetica-Bold').fontSize(11);
    doc.text(branding.clinicNameHindi, margin, headerY + 62, { width: leftBrandW, align: 'center' });
  }

  const doctorName = (doctor?.name || prescription.doctorName || 'Doctor').toUpperCase();
  const qualText = formatQualifications(doctor);
  const regNo = doctor?.registrationNumber?.trim();
  const specialty = doctor?.title?.trim() || branding.doctorSpecialty;

  doc.fillColor(INK).font('Helvetica-Bold').fontSize(15);
  doc.text(doctorName, margin, headerY + 2, { width: contentW, align: 'right' });

  doc.font('Helvetica').fontSize(9.5).fillColor(MUTED);
  doc.text(specialty, margin, doc.y + 2, { width: contentW, align: 'right' });
  if (qualText) {
    doc.text(qualText, margin, doc.y + 2, { width: contentW, align: 'right' });
  }
  if (regNo) {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    doc.text(`Reg No: ${regNo}`, margin, doc.y + 3, { width: contentW, align: 'right' });
  }

  const headerBottom = Math.max(headerY + 92, doc.y + 8);
  drawHLine(doc, headerBottom, margin, pageW - margin, TEAL, 1.2);
  return headerBottom + 12;
};

export const buildPrescriptionPdf = ({ prescription, patient, doctor, includeCombination }) =>
  new Promise((resolve, reject) => {
    const footerReserve = FOOTER_RESERVED;
    const doc = new PDFDocument({
      size: 'A4',
      autoFirstPage: true,
      margins: { top: 40, left: 40, right: 40, bottom: footerReserve },
    });
    const chunks = [];
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 40;
    const contentW = pageW - margin * 2;
    const branding = PRESCRIPTION_BRANDING;
    const contentBottomLimit = pageH - footerReserve;

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const logoPath = assetPath('clinic-logo.png');
    const headerBrandPath = assetPath('header-brand.png');
    const footerPath = assetPath('footer-deco.png');

    if (logoPath) {
      doc.save();
      doc.opacity(0.05);
      const wmSize = 300;
      doc.image(logoPath, (pageW - wmSize) / 2, (pageH - wmSize) / 2 - 30, {
        width: wmSize,
        height: wmSize,
      });
      doc.opacity(1);
      doc.restore();
    }

    let y = drawPrescriptionHeader(doc, {
      pageW,
      margin,
      contentW,
      branding,
      doctor,
      prescription,
      headerBrandPath,
      logoPath,
    });

    const dateStr = moment(prescription.createdAt).format('DD-MM-YYYY');
    const patientName = patient.name || '—';
    const ageStr = patient.age != null ? String(patient.age) : '—';
    const sexStr = patient.gender || 'Male';

    doc.font('Helvetica').fontSize(10).fillColor(INK);
    doc.text('Patient Name : ', margin, y, { continued: true });
    doc.font('Helvetica-Bold').text(patientName, { continued: true });
    doc.font('Helvetica').text('     Age : ', { continued: true });
    doc.font('Helvetica-Bold').text(ageStr);

    const dateLabel = 'Date : ';
    const dateFull = dateLabel + dateStr;
    const dateW = doc.widthOfString(dateFull);
    doc.font('Helvetica').text(dateLabel, pageW - margin - dateW, y, { continued: true });
    doc.font('Helvetica-Bold').text(dateStr);

    y = doc.y + 8;
    doc.font('Helvetica').text('Sex : ', margin, y, { continued: true });
    doc.font('Helvetica-Bold').text(sexStr);

    y = doc.y + 10;
    drawHLine(doc, y, margin, pageW - margin, LINE, 0.6);
    y += 14;

    if (prescription.diagnosis?.trim()) {
      y = drawSectionLabel(doc, 'DIAGNOSIS', margin, y, {
        inlineValue: prescription.diagnosis.trim(),
      });
      y += 8;
    }

    if (prescription.medicines?.length && y < contentBottomLimit) {
      y = drawSectionLabel(doc, 'MEDICINES', margin, y);
      y += 4;
      y = drawMedicineTable(doc, prescription.medicines, y);
    }

    if (prescription.churans?.length && y < contentBottomLimit) {
      y = drawSectionLabel(doc, 'CHURAN', margin, y);
      y += 4;
      doc.font('Helvetica').fontSize(9.5).fillColor(INK);
      prescription.churans.forEach((row, index) => {
        if (y >= contentBottomLimit) return;
        doc.font('Helvetica-Bold').text(`${index + 1}. ${row.name}`, margin + 14, y);
        y = doc.y + 2;
        doc.font('Helvetica');
        const powderRows = row.powders?.filter((p) => p?.name?.trim()) ?? [];
        if (powderRows.length) {
          powderRows.forEach((p) => {
            if (y >= contentBottomLimit) return;
            const spoons = Number(p.quantitySpoons);
            const spoonGrams = Number(p.spoonGrams);
            const grams = Number(p.quantityGrams);
            let line = `  • ${p.name}`;
            if (Number.isFinite(spoons) && spoons > 0 && Number.isFinite(spoonGrams) && spoonGrams > 0) {
              line += ` — ${spoons} spoon${spoons === 1 ? '' : 's'} (${grams}g)`;
            } else if (Number.isFinite(grams) && grams > 0) {
              line += ` — ${grams}g`;
            }
            doc.text(line, margin + 28, y);
            y = doc.y + 2;
          });
        } else if (includeCombination && row.combination?.trim()) {
          doc.text(`Mix: ${row.combination.trim()}`, margin + 28, y);
          y = doc.y + 2;
        }
        if (row.howToIntake?.trim() && y < contentBottomLimit) {
          doc.text(`Intake: ${row.howToIntake.trim()}`, margin + 28, y);
          y = doc.y + 2;
        }
        y += 4;
      });
      y += 4;
    }

    if (prescription.recommendedTests?.length && y < contentBottomLimit) {
      y = drawSectionLabel(doc, 'RECOMMENDED LAB / PF TESTS', margin, y);
      y += 4;
      doc.font('Helvetica').fontSize(9.5).fillColor(INK);
      prescription.recommendedTests.forEach((test, index) => {
        if (y >= contentBottomLimit) return;
        const label = test.categoryName
          ? `${test.testName} (${test.categoryName})`
          : test.testName;
        doc.text(`${index + 1}. ${label}`, margin + 14, y);
        y = doc.y + 3;
      });
      y += 6;
    }

    if (prescription.remarks?.trim() && y < contentBottomLimit) {
      drawSectionLabel(doc, 'REMARK', margin, y, {
        inlineValue: prescription.remarks.trim(),
      });
    }

    drawPrescriptionFooter(doc, { pageW, pageH, branding, footerPath });
    doc.end();
  });
