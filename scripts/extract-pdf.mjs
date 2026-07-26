import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

const pdfPath = path.resolve(process.cwd(), 'SnapStation.in — Premium Wooden Photo Booths _ Pune.pdf');
const outputPath = path.resolve(process.cwd(), 'data', 'pdf-content.txt');

fs.readFile(pdfPath, async (err, data) => {
  if (err) {
    console.error('Failed to read PDF:', err);
    process.exit(1);
  }
  try {
    const result = await pdf(data);
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(outputPath, result.text, 'utf-8');
    console.log('PDF text extracted to', outputPath);
  } catch (e) {
    console.error('PDF parse error:', e);
    process.exit(1);
  }
});
