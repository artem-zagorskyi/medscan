import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { reportToPdf } from './reportPdf.js';

const DATASET_PATH = './output/dataset_uk.csv';
const PDF_DIR      = './output/pdfs';

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv;
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? parseInt(args[i + 1]) : null;
};

const COUNT  = getArg('--count');                 // сколько PDF сгенерировать
const RANDOM = args.includes('--random');         // случайная выборка вместо первых N

// ── Подготовка ───────────────────────────────────────────────────────────────
fs.mkdirSync(PDF_DIR, { recursive: true });

console.log('Loading dataset...');
const raw = fs.readFileSync(DATASET_PATH, 'utf-8');
const records = parse(raw, { columns: true, skip_empty_lines: true });
console.log(`Records in dataset: ${records.length}`);

// ── Выборка ──────────────────────────────────────────────────────────────────
let slice = records;
if (COUNT) {
  if (RANDOM) {
    slice = [...records].sort(() => Math.random() - 0.5).slice(0, COUNT);
    console.log(`Picked ${slice.length} random records`);
  } else {
    slice = records.slice(0, COUNT);
    console.log(`Picked first ${slice.length} records`);
  }
}

console.log(`Generating ${slice.length} PDFs...\n`);

// ── Генерация ────────────────────────────────────────────────────────────────
const counter = new Map();
let done = 0;
const startTime = Date.now();

for (const rec of slice) {
  const data = JSON.parse(rec.report_data);

  // Распределяем по подпапкам по первым 3 цифрам LOINC, чтобы файловая система не упала
  const loincPrefix = rec.loinc_num.split('-')[0].slice(0, 3);
  const subdir = path.join(PDF_DIR, loincPrefix);
  fs.mkdirSync(subdir, { recursive: true });

  const idx = (counter.get(rec.loinc_num) || 0) + 1;
  counter.set(rec.loinc_num, idx);

  const filename = `${rec.loinc_num.replace('-', '_')}_${idx}.pdf`;
  const filepath = path.join(subdir, filename);

  try {
    await reportToPdf(data, filepath);
  } catch (e) {
    console.error(`Error on ${filename}: ${e.message}`);
  }

  done++;
  if (done % 100 === 0) {
    const elapsed = (Date.now() - startTime) / 1000;
    const rate    = (done / elapsed).toFixed(1);
    const eta     = ((slice.length - done) / rate).toFixed(0);
    console.log(`  ${done}/${slice.length}  (${rate} pdf/s, ETA ${eta}s)`);
  }
}

const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n✓ Generated ${done} PDFs in ${totalTime}s → ${PDF_DIR}`);