import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { reportToPdf } from './reportPdf.js';

const DATASET_PATH = './output/dataset_output/dataset_uk.csv';
const PDF_DIR      = './output/dataset_output/pdfs';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv;
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? parseInt(args[i + 1]) : null;
};
const COUNT  = getArg('--count');
const RANDOM = args.includes('--random');

// ── Підготовка ────────────────────────────────────────────────────────────────
fs.mkdirSync(PDF_DIR, { recursive: true });

console.log('Loading dataset...');
const raw = fs.readFileSync(DATASET_PATH, 'utf-8');
const records = parse(raw, { columns: true, skip_empty_lines: true });
console.log(`Records in dataset: ${records.length}`);

// ── Групування по unofficial_name ─────────────────────────────────────────────
// unofficial_name = назва тесту (заголовок PDF)
// mimic_label     = назва параметра (рядок таблиці)
const groupMap = new Map();

for (const rec of records) {
  const key = rec.unofficial_name;
  if (!groupMap.has(key)) {
    groupMap.set(key, {
      unofficial_name: rec.unofficial_name,
      common_name:     rec.common_name,
      category:        rec.category,
      fluid:           rec.fluid,
      rows: [],
    });
  }
  groupMap.get(key).rows.push(rec);
}

let groups = [...groupMap.values()];
console.log(`Unique tests (PDFs): ${groups.length}`);

// ── Вибірка ───────────────────────────────────────────────────────────────────
if (COUNT) {
  if (RANDOM) {
    groups = [...groups].sort(() => Math.random() - 0.5).slice(0, COUNT);
    console.log(`Picked ${groups.length} random groups`);
  } else {
    groups = groups.slice(0, COUNT);
    console.log(`Picked first ${groups.length} groups`);
  }
}

console.log(`Generating ${groups.length} PDFs...\n`);

// ── Допоміжні функції ─────────────────────────────────────────────────────────
const FAKE_LAB       = 'Клінічна лабораторія МедСкан';
const FAKE_PHYSICIAN = 'Лікар А. Вебер';
const FAKE_PATIENT   = 'PAT-00001';

function padNum(n) { return String(n).padStart(6, '0'); }

function randomDate() {
  const d = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  return d.toLocaleDateString('uk-UA');
}

function flagToStatus(flag) {
  if (!flag || flag.trim() === '') return 'НОРМА';
  const f = flag.toLowerCase().trim();
  if (f === 'abnormal' || f === 'аномальний') return 'АНОМАЛЬНИЙ';
  if (f === 'normal'   || f === 'нормальний') return 'НОРМА';
  if (f === 'critical' || f === 'критичний')  return 'КРИТИЧНИЙ';
  return flag.toUpperCase();
}

function safeDirName(str) {
  return str.replace(/[^\wА-ЯҐЄІЇа-яґєії\-]/gi, '_').slice(0, 40);
}

// ── Генерація ─────────────────────────────────────────────────────────────────
let done = 0;
let errors = 0;
const startTime = Date.now();

for (const group of groups) {
  // Кожен рядок групи = один рядок таблиці
  // mimic_label = назва параметра, value/unit/flag = результат
  const parameters = group.rows.map(rec => ({
    name:     rec.mimic_label,
    result:   rec.value,
    unit:     rec.unit,
    refRange: '—',
    status:   flagToStatus(rec.flag),
  }));

  const data = {
    lab:        FAKE_LAB,
    reportNo:   `RPT-${padNum(done + 1)}`,
    reportDate: randomDate(),
    patientId:  FAKE_PATIENT,
    sampleId:   `SMP-${padNum(done + 1)}`,
    sampleType: group.fluid,
    collection: randomDate(),
    physician:  FAKE_PHYSICIAN,
    category:   group.category,
    testName:   group.unofficial_name,  // заголовок звіту
    parameters,
  };

  // Підпапка по першій літері unofficial_name
  const firstChar = (group.unofficial_name || 'X').charAt(0).toUpperCase();
  const subdir = path.join(PDF_DIR, firstChar);
  fs.mkdirSync(subdir, { recursive: true });

  const filename = `${safeDirName(group.unofficial_name)}_${padNum(done + 1)}.pdf`;
  const filepath = path.join(subdir, filename);

  try {
    await reportToPdf(data, filepath);
  } catch (e) {
    console.error(`\nError on "${group.unofficial_name}": ${e.message}`);
    errors++;
  }

  done++;

  const elapsed = (Date.now() - startTime) / 1000;
  const rate    = (done / elapsed).toFixed(1);
  const eta     = ((groups.length - done) / rate).toFixed(0);
  const pct     = ((done / groups.length) * 100).toFixed(1);
  process.stdout.write(`\r[${pct}%] ${done}/${groups.length}  |  ${rate} pdf/s  |  ETA ${eta}s    `);
}

const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
process.stdout.write('\n');
console.log(`\nDone in ${totalTime}s`);
console.log(`Generated: ${done - errors} PDFs  |  Errors: ${errors}`);
console.log(`Saved to: ${PDF_DIR}`);