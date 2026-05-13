import fs from 'fs';
import { parse } from 'csv-parse/sync';

const BLACKLIST_CLASSES = new Set([
  'SPEC',   // Specimen — всякие "тип зразка", "джерело зразка"
]);

const BLACKLIST_COMPONENTS = new Set([
  'Collection supervision level',
  'Specimen source',
  'Fasting status',
  'Age',
  'Service comment',
  'Blood product type',
  'Blood product disposition',
  'Blood product unit',
  'Appearance',
  'Color',
]);

export function loadLabTests(csvPath, maxTests = null) {
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true });

  // Только лабораторные активные тесты
  let lab = rows.filter(r =>
    r.CLASSTYPE === '1' &&
    r.STATUS === 'ACTIVE' &&
    r.LONG_COMMON_NAME?.length > 3 &&
    !BLACKLIST_CLASSES.has(r.CLASS) &&           
    !BLACKLIST_COMPONENTS.has(r.COMPONENT)
  );

  // Сортируем: сначала популярные (COMMON_TEST_RANK > 0), потом остальные
  // Меньший ранг = более популярный тест
  lab.sort((a, b) => {
    const rankA = parseInt(a.COMMON_TEST_RANK) || 999999;
    const rankB = parseInt(b.COMMON_TEST_RANK) || 999999;
    return rankA - rankB;
  });

  if (maxTests) {
    lab = lab.slice(0, maxTests);
  }

  return lab;
}

export function cleanLongName(name) {
  if (!name) return '';
  return name
    .replace(/\s+(Nominal|Ordinal|Quantitative|Narrative|Document)$/i, '')
    .trim();
}