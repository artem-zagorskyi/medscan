import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { config } from './config.js';
import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';

// Формирование ключа для дедупликации — те поля, которые пойдут в embedding
function makeKey(record) {
  const norm = (s) => (s || '').toString().trim().toLowerCase();
  return [
    norm(record.unofficial_name),
    norm(record.category),
    norm(record.fluid),
    norm(record.unit),
  ].join('|');
}

async function main() {
  console.log('=== Анализ train-выборки на уникальность ===\n');

  const csvText = fs.readFileSync(config.paths.train, 'utf-8');
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Всего строк в train: ${records.length}\n`);

  // === Уникальность по комбинации полей ===
  const uniqueKeys = new Map(); // key -> { record, count }
  for (const rec of records) {
    const key = makeKey(rec);
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, { record: rec, count: 0 });
    }
    uniqueKeys.get(key).count++;
  }

  console.log(`Уникальных комбинаций (unofficial_name + category + fluid + unit): ${uniqueKeys.size}`);
  console.log(`Коэффициент дедупликации: ${(records.length / uniqueKeys.size).toFixed(1)}x\n`);

  // === Распределение: сколько вариантов на класс ===
  const variantsPerClass = new Map(); // common_name -> Set of unique keys
  for (const [key, { record }] of uniqueKeys) {
    const cls = record.common_name;
    if (!variantsPerClass.has(cls)) variantsPerClass.set(cls, new Set());
    variantsPerClass.get(cls).add(key);
  }

  const variantCounts = [...variantsPerClass.values()]
    .map((set) => set.size)
    .sort((a, b) => b - a);

  console.log('Распределение уникальных вариантов на класс:');
  console.log(`  Классов всего: ${variantsPerClass.size}`);
  console.log(`  Максимум вариантов: ${variantCounts[0]}`);
  console.log(`  Минимум вариантов: ${variantCounts[variantCounts.length - 1]}`);
  console.log(`  Медиана: ${variantCounts[Math.floor(variantCounts.length / 2)]}`);
  console.log(`  Среднее: ${(variantCounts.reduce((a, b) => a + b, 0) / variantCounts.length).toFixed(1)}\n`);

  // === Топ-10 классов по количеству вариантов ===
  const topClasses = [...variantsPerClass.entries()]
    .map(([cls, set]) => [cls, set.size])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('Топ-10 классов по числу уникальных написаний:');
  for (const [cls, count] of topClasses) {
    console.log(`  ${count.toString().padStart(4)} — ${cls}`);
  }
  console.log();

  // === Топ-10 самых частых уникальных комбинаций ===
  const topCombinations = [...uniqueKeys.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  console.log('Топ-10 самых частых комбинаций в датасете:');
  for (const { record, count } of topCombinations) {
    console.log(`  ${count.toString().padStart(6)} раз — "${record.unofficial_name}" → ${record.common_name}`);
  }
  console.log();

  // === Оценка ресурсов для индексации ===
  const n = uniqueKeys.size;
  const sizeBytes = n * 768 * 4; // 768 float32
  const sizeMb = (sizeBytes / 1024 / 1024).toFixed(1);
  const estimatedTimeMinMin = (n * 0.3) / 60; // 300мс на embedding через прокси
  const estimatedTimeMaxMin = (n * 1.0) / 60; // 1000мс пессимистично

  console.log('Оценка ресурсов на индексацию:');
  console.log(`  Embeddings нужно посчитать: ${n}`);
  console.log(`  Размер векторов в памяти: ~${sizeMb} МБ`);
  console.log(`  Ожидаемое время (через RunPod): ${estimatedTimeMinMin.toFixed(0)}–${estimatedTimeMaxMin.toFixed(0)} минут`);
}

const isMainModule = fileURLToPath(import.meta.url) === argv[1];

if (isMainModule) {
  main().catch((err) => {
    console.error('Ошибка:', err);
    process.exit(1);
  });
}