import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../../sample-files');
const outFile = path.join(outDir, 'Jairam-Deo-Prescription-sample.pdf');

fs.mkdirSync(outDir, { recursive: true });

const doc = new PDFDocument({ size: 'A4', margin: 50 });
const stream = fs.createWriteStream(outFile);
doc.pipe(stream);

doc.fontSize(18).fillColor('#2a6b54').text('Ayurveda Health', { align: 'center' });
doc.fontSize(11).fillColor('#666').text('Hospital Management — Prescription', { align: 'center' });
doc.moveDown(1.5);

doc.fillColor('#000').fontSize(10);
doc.text('Patient Name: Jairam Deo');
doc.text('Patient Code: AH-001/06-26');
doc.text('Mobile: 8830973046');
doc.text('Prakriti: Vata');
doc.text('Age / Gender: 24 yrs / Male');
doc.moveDown();

doc.fontSize(12).fillColor('#2a6b54').text('Prescribed by: Dr. Ananya Sharma');
doc.fontSize(10).fillColor('#000').text('Visit: General Consult — 2 June 2026');
doc.moveDown();

doc.fontSize(11).text('Medicines:', { underline: true });
doc.moveDown(0.5);
doc.fontSize(10);
doc.list(
  [
    'Triphala Churna — 1 tsp at bedtime, after food',
    'Ashwagandha — 500 mg, twice daily with warm milk',
  ],
  { bulletRadius: 2, textIndent: 12 }
);
doc.moveDown();

doc.text('Diet & lifestyle advice:', { underline: true });
doc.moveDown(0.3);
doc.text('Prefer warm, cooked meals; avoid cold salads and iced drinks. Light stretching and regular sleep.');
doc.moveDown(2);

doc.fontSize(9).fillColor('#666');
doc.text('This is a sample PDF for testing prescription upload in the admin portal.', {
  align: 'center',
});
doc.text('Not a legally valid prescription.', { align: 'center' });

doc.end();

stream.on('finish', () => {
  console.log(`Created: ${outFile}`);
});
