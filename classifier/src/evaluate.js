import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';
import { parse } from 'csv-parse/sync';
import { config } from './config.js';
import { loadIndex, classify, strategyTop1, strategyVoting, searchTopK } from './classify.js';
import { getEmbedding, generateKeywords } from './utils/ollama.js';
import { normalize } from './utils/vector.js';

function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hours = Math.floor(min / 60);
  const remMin = min % 60;
  const remSec = sec % 60;
  if (hours > 0) return `${hours}г ${remMin}м ${remSec}с`;
  if (min > 0) return `${min}м ${remSec}с`;
  return `${remSec}с`;
}

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
  console.log('=== Оцінка класифікатора на тестовій вибірці ===\n');

  // === 1. Завантаження індексу ===
  console.log('Завантаження індексу...');
  const startLoad = Date.now();
  const index = loadIndex();
  console.log(`  Завантажено ${index.n} векторів за ${Date.now() - startLoad} мс\n`);

  // === 2. Читання та дедуплікація test.csv ===
  console.log(`Читання test: ${config.paths.test}`);
  const csvText = fs.readFileSync(config.paths.test, 'utf-8');
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  console.log(`  Рядків: ${records.length}`);

  const uniqueMap = new Map();
  for (const rec of records) {
    const key = makeKey(rec);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, {
        record: rec,
        count: 0,
      });
    }
    uniqueMap.get(key).count++;
  }
  const uniqueEntries = [...uniqueMap.values()];
  console.log(`  Унікальних комбінацій: ${uniqueEntries.length}`);
  console.log(`  Коефіцієнт дедуплікації: ${(records.length / uniqueEntries.length).toFixed(1)}x\n`);

  // === 3. Класифікація кожної унікальної комбінації ===
  console.log(`Класифікація ${uniqueEntries.length} унікальних запитів...\n`);

  const K = 10;
  const startTime = Date.now();
  let processed = 0;
  let failed = 0;

  // Лічильники для метрик (зважені на count — скільки разів ця комбінація зустрічалась)
  const metrics = {
    top1: { correct_top1: 0, correct_top3: 0, correct_top5: 0, total: 0 },
    voting: { correct_top1: 0, correct_top3: 0, correct_top5: 0, total: 0 },
  };

  // Лічильники без ваг (кожна унікальна комбінація = 1)
  const metricsUnweighted = {
    top1: { correct_top1: 0, correct_top3: 0, correct_top5: 0, total: 0 },
    voting: { correct_top1: 0, correct_top3: 0, correct_top5: 0, total: 0 },
  };

  // Зберігаємо помилки для аналізу
  const errors = [];

  for (const { record, count } of uniqueEntries) {
    const expectedClass = record.common_name;

    try {
      const result = await classify(record, index, { k: K });

      // Перевіряємо обидві стратегії
      for (const [strategyName, ranking] of [['top1', result.top1], ['voting', result.voting]]) {
        const predictedNames = ranking.map(r => r.common_name);
        const inTop1 = predictedNames.length >= 1 && predictedNames[0] === expectedClass;
        const inTop3 = predictedNames.slice(0, 3).includes(expectedClass);
        const inTop5 = predictedNames.slice(0, 5).includes(expectedClass);

        // Зважені метрики
        metrics[strategyName].total += count;
        if (inTop1) metrics[strategyName].correct_top1 += count;
        if (inTop3) metrics[strategyName].correct_top3 += count;
        if (inTop5) metrics[strategyName].correct_top5 += count;

        // Незважені метрики
        metricsUnweighted[strategyName].total += 1;
        if (inTop1) metricsUnweighted[strategyName].correct_top1 += 1;
        if (inTop3) metricsUnweighted[strategyName].correct_top3 += 1;
        if (inTop5) metricsUnweighted[strategyName].correct_top5 += 1;

        // Зберігаємо помилки top-1 для стратегії top1
        if (strategyName === 'top1' && !inTop1) {
          errors.push({
            unofficial_name: record.unofficial_name,
            category: record.category,
            fluid: record.fluid,
            unit: record.unit,
            expected: expectedClass,
            predicted: predictedNames[0] || '(немає)',
            score: ranking[0]?.score || 0,
            in_top3: inTop3,
            in_top5: inTop5,
            count,
            keywords: result.keywords,
          });
        }
      }

      processed++;
    } catch (err) {
      failed++;
      console.error(`  ✗ "${record.unofficial_name}": ${err.message}`);
    }

    // Прогрес кожні 50 записів
    if ((processed + failed) % 50 === 0 || (processed + failed) === uniqueEntries.length) {
      const elapsed = Date.now() - startTime;
      const done = processed + failed;
      const rate = done / (elapsed / 1000);
      const remaining = uniqueEntries.length - done;
      const eta = remaining / rate * 1000;

      // Поточна accuracy top-1 (top1 стратегія, зважена)
      const currentAcc = metrics.top1.total > 0
        ? (metrics.top1.correct_top1 / metrics.top1.total * 100).toFixed(1)
        : '?';

      console.log(
        `  [${done}/${uniqueEntries.length}] ` +
        `${rate.toFixed(2)} req/с | ` +
        `acc=${currentAcc}% | ` +
        `пройшло ${formatDuration(elapsed)} | ` +
        `залишилось ~${formatDuration(eta)}`
      );
    }
  }

  const totalTime = Date.now() - startTime;

  // === 4. Фінальний звіт ===
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`=== РЕЗУЛЬТАТИ ОЦІНКИ ===`);
  console.log(`${'═'.repeat(80)}\n`);

  console.log(`Час: ${formatDuration(totalTime)}`);
  console.log(`Оброблено: ${processed} унікальних комбінацій (${metrics.top1.total} зважених рядків)`);
  console.log(`Помилок обробки: ${failed}\n`);

  // Зважені метрики (враховують частоту кожної комбінації в датасеті)
  console.log('--- Зважені метрики (кожен рядок test.csv = 1 голос) ---\n');
  for (const [name, m] of Object.entries(metrics)) {
    const acc1 = (m.correct_top1 / m.total * 100).toFixed(2);
    const acc3 = (m.correct_top3 / m.total * 100).toFixed(2);
    const acc5 = (m.correct_top5 / m.total * 100).toFixed(2);
    console.log(`  Стратегія "${name}":`);
    console.log(`    Top-1 accuracy: ${acc1}% (${m.correct_top1}/${m.total})`);
    console.log(`    Top-3 accuracy: ${acc3}% (${m.correct_top3}/${m.total})`);
    console.log(`    Top-5 accuracy: ${acc5}% (${m.correct_top5}/${m.total})\n`);
  }

  // Незважені метрики (кожна унікальна комбінація = 1)
  console.log('--- Незважені метрики (кожна унікальна комбінація = 1 голос) ---\n');
  for (const [name, m] of Object.entries(metricsUnweighted)) {
    const acc1 = (m.correct_top1 / m.total * 100).toFixed(2);
    const acc3 = (m.correct_top3 / m.total * 100).toFixed(2);
    const acc5 = (m.correct_top5 / m.total * 100).toFixed(2);
    console.log(`  Стратегія "${name}":`);
    console.log(`    Top-1 accuracy: ${acc1}% (${m.correct_top1}/${m.total})`);
    console.log(`    Top-3 accuracy: ${acc3}% (${m.correct_top3}/${m.total})`);
    console.log(`    Top-5 accuracy: ${acc5}% (${m.correct_top5}/${m.total})\n`);
  }

  // === 5. Аналіз помилок ===
  console.log(`--- Аналіз помилок (стратегія top1) ---\n`);
  console.log(`  Всього помилок top-1: ${errors.length} унікальних комбінацій`);
  
  const errorsInTop3 = errors.filter(e => e.in_top3).length;
  const errorsInTop5 = errors.filter(e => e.in_top5).length;
  console.log(`  З них правильна відповідь в top-3: ${errorsInTop3}`);
  console.log(`  З них правильна відповідь в top-5: ${errorsInTop5}`);
  console.log(`  Повністю промахнулись (немає в top-5): ${errors.length - errorsInTop5}\n`);

  // Топ-10 найбільш "дорогих" помилок (за count — скільки разів зустрічається в test)
  const sortedErrors = [...errors].sort((a, b) => b.count - a.count);
  console.log('  Топ-10 найчастіших помилок:');
  for (const err of sortedErrors.slice(0, 10)) {
    console.log(`    ${err.count.toString().padStart(5)} разів | "${err.unofficial_name}" → очікувалось: "${err.expected.slice(0, 50)}" | отримано: "${err.predicted.slice(0, 50)}" | score: ${err.score.toFixed(4)} | top3: ${err.in_top3 ? '✓' : '✗'} | top5: ${err.in_top5 ? '✓' : '✗'}`);
  }

  // === 6. Збереження результатів ===
  const outputDir = path.dirname(config.paths.results);
  fs.mkdirSync(outputDir, { recursive: true });

  const report = {
    timestamp: new Date().toISOString(),
    duration_ms: totalTime,
    test_records: records.length,
    unique_combinations: uniqueEntries.length,
    processed,
    failed,
    metrics_weighted: {},
    metrics_unweighted: {},
    errors_summary: {
      total_errors: errors.length,
      in_top3: errorsInTop3,
      in_top5: errorsInTop5,
      missed_completely: errors.length - errorsInTop5,
    },
    top_errors: sortedErrors.slice(0, 50).map(e => ({
      unofficial_name: e.unofficial_name,
      category: e.category,
      fluid: e.fluid,
      unit: e.unit,
      expected: e.expected,
      predicted: e.predicted,
      score: e.score,
      in_top3: e.in_top3,
      in_top5: e.in_top5,
      count: e.count,
      keywords: e.keywords,
    })),
  };

  for (const [name, m] of Object.entries(metrics)) {
    report.metrics_weighted[name] = {
      top1_accuracy: m.correct_top1 / m.total,
      top3_accuracy: m.correct_top3 / m.total,
      top5_accuracy: m.correct_top5 / m.total,
      correct_top1: m.correct_top1,
      correct_top3: m.correct_top3,
      correct_top5: m.correct_top5,
      total: m.total,
    };
  }

  for (const [name, m] of Object.entries(metricsUnweighted)) {
    report.metrics_unweighted[name] = {
      top1_accuracy: m.correct_top1 / m.total,
      top3_accuracy: m.correct_top3 / m.total,
      top5_accuracy: m.correct_top5 / m.total,
      correct_top1: m.correct_top1,
      correct_top3: m.correct_top3,
      correct_top5: m.correct_top5,
      total: m.total,
    };
  }

  // Повний лог помилок — окремий файл
  const errorsPath = path.join(outputDir, 'evaluation_errors.json');
  fs.writeFileSync(errorsPath, JSON.stringify(sortedErrors, null, 2), 'utf-8');

  // Основний звіт
  fs.writeFileSync(config.paths.results, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\n  Звіт збережено: ${config.paths.results}`);
  console.log(`  Помилки збережено: ${errorsPath}`);
  console.log(`\nГотово.`);
}

const isMainModule = fileURLToPath(import.meta.url) === argv[1];

if (isMainModule) {
  main().catch((err) => {
    console.error('Фатальна помилка:', err);
    process.exit(1);
  });
}