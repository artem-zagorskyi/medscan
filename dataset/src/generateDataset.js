import fs from 'fs';
import { stringify } from 'csv-stringify/sync';
import { loadLabTests, cleanLongName } from './loadLoinc.js';
import { getAllNameVariants } from './synonyms.js';
import { buildReportData } from './reportData.js';

const LOINC_PATH  = './data/Loinc.csv';
const OUTPUT_PATH = './output/dataset.csv';

const args = process.argv;
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? parseInt(args[i + 1]) : null;
};

const MAX_TESTS   = getArg('--tests')    || 300;   // сколько уникальных тестов
const MAX_RECORDS = getArg('--records')  || 20000; // лимит итоговых записей

// Вариантов на тест вычисляем автоматически
// чтобы равномерно распределить MAX_RECORDS по MAX_TESTS
const VARIANTS_PER_TEST = Math.ceil(MAX_RECORDS / MAX_TESTS);

console.log(`Tests:    ${MAX_TESTS}`);
console.log(`Records:  ${MAX_RECORDS}`);
console.log(`Variants per test: ${VARIANTS_PER_TEST}`);

fs.mkdirSync('./output', { recursive: true });

console.log('\nLoading LOINC...');
const tests = loadLabTests('./data/Loinc.csv', MAX_TESTS);
console.log(`Loaded: ${tests.length} tests`);

// Показываем что взяли
console.log('\nTop 10 selected tests:');
tests.slice(0, 10).forEach(t =>
  console.log(`  [rank ${t.COMMON_TEST_RANK || 'n/a'}] ${t.LONG_COMMON_NAME?.slice(0, 60)}`)
);

const records = [];

outer:
for (const row of tests) {
  const variants = getAllNameVariants(row);
  if (!variants.length) continue;

  // Берём нужное количество вариантов, повторяем если вариантов меньше
  const selected = [];
  while (selected.length < VARIANTS_PER_TEST) {
    const shuffled = [...variants].sort(() => Math.random() - 0.5);
    selected.push(...shuffled);
  }
  const finalSelected = selected.slice(0, VARIANTS_PER_TEST);

  for (const rawName of finalSelected) {
    if (records.length >= MAX_RECORDS) break outer;

    const reportData = buildReportData(rawName, row.SCALE_TYP || 'Qn', row.CLASS);

    records.push({
      loinc_num:     row.LOINC_NUM,
      raw_test_name: rawName,
      long_name:     cleanLongName(row.LONG_COMMON_NAME),
      class:         row.CLASS,
      component:     row.COMPONENT,
      system:        row.SYSTEM,
      scale_typ:     row.SCALE_TYP,
      report_data:   JSON.stringify(reportData),
    });
  }
}

console.log(`\nRecords generated: ${records.length}`);

// Статистика по классам
const classCounts = {};
const labelCounts = {};
for (const r of records) {
  classCounts[r.class] = (classCounts[r.class] || 0) + 1;
  labelCounts[r.long_name] = (labelCounts[r.long_name] || 0) + 1;
}
console.log(`Unique labels (long_name): ${Object.keys(labelCounts).length}`);
console.log(`Records per label: min=${Math.min(...Object.values(labelCounts))}, max=${Math.max(...Object.values(labelCounts))}, avg=${(records.length / Object.keys(labelCounts).length).toFixed(1)}`);
console.log(`\nClass distribution:`);
Object.entries(classCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([cls, cnt]) => console.log(`  ${cls.padEnd(20)} ${cnt}`));

fs.writeFileSync(OUTPUT_PATH, stringify(records, { header: true }));
console.log(`\nSaved to ${OUTPUT_PATH}`);