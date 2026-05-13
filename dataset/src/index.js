import fs from 'fs';
import path from 'path';
import { stringify } from 'csv-stringify/sync';
import { loadLabTests } from './loadLoinc.js';
import { getAllNameVariants } from './synonyms.js';
import { generateReport } from './reportGenerator.js';

const LOINC_PATH    = './data/Loinc.csv';
const OUTPUT_PATH   = './output/dataset.csv';
const VARIANTS_PER_TEST = 3;   // сколько X-вариантов на один тест
const MAX_TESTS     = null;    // null = все лабораторные тесты

fs.mkdirSync('./output', { recursive: true });

console.log('Loading LOINC...');
let tests = loadLabTests(LOINC_PATH);
console.log(`Lab tests loaded: ${tests.length}`);

if (MAX_TESTS) tests = tests.slice(0, MAX_TESTS);

const records = [];

for (const row of tests) {
  const variants = getAllNameVariants(row);
  if (!variants.length) continue;

  // Берём случайные VARIANTS_PER_TEST синонимов
  const shuffled = variants.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, VARIANTS_PER_TEST);

  for (const rawName of selected) {
    const reportText = generateReport(row, rawName);
    records.push({
      loinc_num:      row.LOINC_NUM,
      raw_test_name:  rawName,           // X — вход для классификатора
      long_name:      row.LONG_COMMON_NAME, // Y — label
      class:          row.CLASS,
      component:      row.COMPONENT,
      system:         row.SYSTEM,
      scale_typ:      row.SCALE_TYP,
      report_text:    reportText,        // полный текст отчёта
    });
  }
}

console.log(`Records generated: ${records.length}`);

const csv = stringify(records, { header: true });
fs.writeFileSync(OUTPUT_PATH, csv);
console.log(`Saved to ${OUTPUT_PATH}`);