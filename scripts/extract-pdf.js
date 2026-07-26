// scripts/extract-pdf.js
// Extract text from SnapStation PDF and save to data/photoBoothContent.txt

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = path.resolve(__dirname, '..', 'SnapStation.in — Premium Wooden Photo Booths _ Pune.pdf');
const outputPath = path.resolve(__dirname, '..', 'data', 'photoBoothContent.txt');

fs.readFile(pdfPath, (err, data) => {
  if (err) {
    console.error('Error reading PDF:', err);
    process.exit(1);
  }
  pdf(data)
    .then(result => {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, result.text, 'utf8');
      console.log('Extracted text written to', outputPath);
    })
    .catch(e => {
      console.error('PDF parsing error:', e);
      process.exit(1);
    });
});
