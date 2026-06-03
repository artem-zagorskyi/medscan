import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { config } from './config.js';
import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';

// Простой seedable PRNG (Mulberry32) — для воспроизводимости результатов
function createRng(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Перемешивание Fisher-Yates
function shuffle(array, rng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Преобразует массив объектов обратно в CSV
function recordsToCsv(records, headers) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const headerLine = headers.join(',');
  const lines = records.map((rec) => headers.map((h) => escape(rec[h])).join(','));
  return [headerLine, ...lines].join('\n');
}

async function main() {
  console.log('=== Перемешивание и разделение датасета ===\n');

  // 1. Читаем исходный CSV
  console.log(`Чтение датасета: ${config.paths.dataset}`);
  const csvText = fs.readFileSync(config.paths.dataset, 'utf-8');
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  console.log(`  Загружено строк: ${records.length}`);

  if (records.length === 0) {
    throw new Error('Датасет пустой');
  }

  const headers = Object.keys(records[0]);
  console.log(`  Колонки: ${headers.join(', ')}\n`);

  // 2. Статистика по классам ДО разделения
  const classCount = new Map();
  for (const rec of records) {
    const cls = rec.common_name;
    classCount.set(cls, (classCount.get(cls) || 0) + 1);
  }
  console.log(`Уникальных классов (common_name): ${classCount.size}`);
  const counts = [...classCount.values()].sort((a, b) => b - a);
  console.log(`  Максимум строк на класс: ${counts[0]}`);
  console.log(`  Минимум строк на класс: ${counts[counts.length - 1]}`);
  console.log(`  Медиана: ${counts[Math.floor(counts.length / 2)]}\n`);

  // 3. Перемешиваем с фиксированным seed
  console.log(`Перемешивание (seed = ${config.split.randomSeed})...`);
  const rng = createRng(config.split.randomSeed);
  const shuffled = shuffle(records, rng);

  // 4. Сохраняем перемешанный полный датасет
  const outputDir = path.dirname(config.paths.shuffled);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(config.paths.shuffled, recordsToCsv(shuffled, headers), 'utf-8');
  console.log(`  Сохранено: ${config.paths.shuffled}\n`);

  // 5. Стратифицированное разделение train/test
  //    Для каждого класса берём пропорцию trainRatio в train, остальное в test
  //    Это гарантирует что в test попадут ВСЕ классы
  console.log(`Стратифицированное разделение (train = ${config.split.trainRatio * 100}%)...`);

  const byClass = new Map();
  for (const rec of shuffled) {
    const cls = rec.common_name;
    if (!byClass.has(cls)) byClass.set(cls, []);
    byClass.get(cls).push(rec);
  }

  const train = [];
  const test = [];
  let classesOnlyInTrain = 0; // классы где только 1 запись — нельзя разделить

  for (const [cls, items] of byClass) {
    if (items.length < 2) {
      // Если у класса всего 1 запись — её некуда отдать в test без потери класса
      // Кладём в train, но фиксируем для отчёта
      train.push(...items);
      classesOnlyInTrain++;
      continue;
    }
    const trainSize = Math.max(1, Math.floor(items.length * config.split.trainRatio));
    train.push(...items.slice(0, trainSize));
    test.push(...items.slice(trainSize));
  }

  console.log(`  Train: ${train.length} строк`);
  console.log(`  Test:  ${test.length} строк`);
  if (classesOnlyInTrain > 0) {
    console.log(`  ⚠ Классов с единственной записью (только в train): ${classesOnlyInTrain}`);
  }
  console.log();

  // 6. Сохраняем train и test
  fs.writeFileSync(config.paths.train, recordsToCsv(train, headers), 'utf-8');
  fs.writeFileSync(config.paths.test, recordsToCsv(test, headers), 'utf-8');
  console.log(`  Сохранено: ${config.paths.train}`);
  console.log(`  Сохранено: ${config.paths.test}\n`);

  console.log('Готово.');
}

const isMainModule = fileURLToPath(import.meta.url) === argv[1];

if (isMainModule) {
  main().catch((err) => {
    console.error('Ошибка:', err);
    process.exit(1);
  });
}