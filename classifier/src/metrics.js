import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';
import { parse } from 'csv-parse/sync';

const RESULTS_PATH = process.env.RESULTS_PATH || './output/evaluation_results.json';
const ERRORS_PATH = './output/evaluation_errors.json';
const TEST_PATH = process.env.TEST_PATH || './output/test.csv';

function loadJson(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`Файл не знайдено: ${abs}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(abs, 'utf-8'));
}

function makeKey(rec) {
  const norm = (s) => (s || '').toString().trim().toLowerCase();
  return [
    norm(rec.unofficial_name),
    norm(rec.category),
    norm(rec.fluid),
    norm(rec.unit),
  ].join('|');
}

function main() {
  console.log('=== Метрики класифікатора ===\n');

  const report = loadJson(RESULTS_PATH);
  const errors = loadJson(ERRORS_PATH);

  // Читаємо test.csv для відновлення повної confusion matrix
  console.log('Завантаження test.csv...');
  const csvText = fs.readFileSync(path.resolve(TEST_PATH), 'utf-8');
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  console.log(`  Рядків: ${records.length}\n`);

  // Збираємо унікальні комбінації з test.csv
  const uniqueMap = new Map();
  for (const rec of records) {
    const key = makeKey(rec);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, { record: rec, count: 0 });
    }
    uniqueMap.get(key).count++;
  }

  // Збираємо ключі помилок для швидкого пошуку
  const errorMap = new Map();
  for (const err of errors) {
    const key = makeKey({
      unofficial_name: err.unofficial_name,
      category: err.category,
      fluid: err.fluid,
      unit: err.unit,
    });
    errorMap.set(key, err);
  }

  // ─── 1. Базові accuracy метрики ──────────────────────────────

  const wTop1 = report.metrics_weighted.top1;
  const uTop1 = report.metrics_unweighted.top1;

  console.log('─── Accuracy ───────────────────────────────────────────────\n');

  console.log('  Зважена (weighted):');
  console.log(`    Top-1:  ${(wTop1.top1_accuracy * 100).toFixed(2)}%  (${wTop1.correct_top1}/${wTop1.total})`);
  console.log(`    Top-3:  ${(wTop1.top3_accuracy * 100).toFixed(2)}%`);
  console.log(`    Top-5:  ${(wTop1.top5_accuracy * 100).toFixed(2)}%\n`);

  console.log('  Незважена (unweighted):');
  console.log(`    Top-1:  ${(uTop1.top1_accuracy * 100).toFixed(2)}%  (${uTop1.correct_top1}/${uTop1.total})`);
  console.log(`    Top-3:  ${(uTop1.top3_accuracy * 100).toFixed(2)}%`);
  console.log(`    Top-5:  ${(uTop1.top5_accuracy * 100).toFixed(2)}%\n`);

  // ─── 2. Micro F1 ──────────────────────────────────────────────

  function microF1(correct, total) {
    const tp = correct;
    const fp = total - correct;
    const fn = total - correct;
    const precision = tp / (tp + fp);
    const recall = tp / (tp + fn);
    const f1 = 2 * precision * recall / (precision + recall);
    return { precision, recall, f1 };
  }

  const mwTop1 = microF1(wTop1.correct_top1, wTop1.total);
  const muTop1 = microF1(uTop1.correct_top1, uTop1.total);

  console.log('─── Micro-averaged F1 ─────────────────────────────────────\n');
  console.log('  Зважений:');
  console.log(`    Precision: ${(mwTop1.precision * 100).toFixed(2)}%  Recall: ${(mwTop1.recall * 100).toFixed(2)}%  F1: ${(mwTop1.f1 * 100).toFixed(2)}%`);
  console.log('  Незважений:');
  console.log(`    Precision: ${(muTop1.precision * 100).toFixed(2)}%  Recall: ${(muTop1.recall * 100).toFixed(2)}%  F1: ${(muTop1.f1 * 100).toFixed(2)}%\n`);

  // ─── 3. Per-class TP/FP/FN ────────────────────────────────────

  const stats = new Map();

  function ensure(cls) {
    if (!stats.has(cls)) {
      stats.set(cls, {
        tp: 0, fp: 0, fn: 0,
        tp_weighted: 0, fp_weighted: 0, fn_weighted: 0,
      });
    }
    return stats.get(cls);
  }

  // Проходимо по всіх унікальних комбінаціях
  for (const [key, { record, count }] of uniqueMap) {
    const expected = record.common_name;
    ensure(expected);

    const err = errorMap.get(key);
    if (err) {
      // Це помилка: FN для expected, FP для predicted
      stats.get(expected).fn += 1;
      stats.get(expected).fn_weighted += count;

      const predicted = err.predicted;
      ensure(predicted);
      stats.get(predicted).fp += 1;
      stats.get(predicted).fp_weighted += count;
    } else {
      // Правильна класифікація: TP для expected
      stats.get(expected).tp += 1;
      stats.get(expected).tp_weighted += count;
    }
  }

  // ─── 4. Per-class precision/recall/F1 ─────────────────────────

  const perClass = [];
  for (const [cls, s] of stats) {
    const precision = (s.tp + s.fp) > 0 ? s.tp / (s.tp + s.fp) : 0;
    const recall = (s.tp + s.fn) > 0 ? s.tp / (s.tp + s.fn) : 0;
    const f1 = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0;

    const p_w = (s.tp_weighted + s.fp_weighted) > 0 ? s.tp_weighted / (s.tp_weighted + s.fp_weighted) : 0;
    const r_w = (s.tp_weighted + s.fn_weighted) > 0 ? s.tp_weighted / (s.tp_weighted + s.fn_weighted) : 0;
    const f1_w = (p_w + r_w) > 0 ? 2 * p_w * r_w / (p_w + r_w) : 0;

    perClass.push({
      common_name: cls,
      tp: s.tp, fp: s.fp, fn: s.fn,
      precision, recall, f1,
      tp_weighted: s.tp_weighted, fp_weighted: s.fp_weighted, fn_weighted: s.fn_weighted,
      precision_weighted: p_w, recall_weighted: r_w, f1_weighted: f1_w,
      support: s.tp + s.fn,
      support_weighted: s.tp_weighted + s.fn_weighted,
    });
  }

  // ─── 5. Macro F1 ──────────────────────────────────────────────

  const classesInTest = perClass.filter(c => c.support > 0);

  function macroAvg(items, field) {
    if (items.length === 0) return 0;
    return items.reduce((sum, x) => sum + x[field], 0) / items.length;
  }

  const macroPrecision = macroAvg(classesInTest, 'precision');
  const macroRecall = macroAvg(classesInTest, 'recall');
  const macroF1 = macroAvg(classesInTest, 'f1');

  const macroPrecisionW = macroAvg(classesInTest, 'precision_weighted');
  const macroRecallW = macroAvg(classesInTest, 'recall_weighted');
  const macroF1W = macroAvg(classesInTest, 'f1_weighted');

  console.log('─── Macro-averaged F1 (середнє по всіх класах) ────────────\n');
  console.log(`  Класів у тесті: ${classesInTest.length}\n`);

  console.log('  Незважений (per-class TP/FP/FN по унікальних комбінаціях):');
  console.log(`    Precision: ${(macroPrecision * 100).toFixed(2)}%`);
  console.log(`    Recall:    ${(macroRecall * 100).toFixed(2)}%`);
  console.log(`    F1:        ${(macroF1 * 100).toFixed(2)}%\n`);

  console.log('  Зважений (per-class TP/FP/FN по реальній частоті):');
  console.log(`    Precision: ${(macroPrecisionW * 100).toFixed(2)}%`);
  console.log(`    Recall:    ${(macroRecallW * 100).toFixed(2)}%`);
  console.log(`    F1:        ${(macroF1W * 100).toFixed(2)}%\n`);

  // ─── 6. Weighted F1 (по support) ──────────────────────────────

  const totalSupport = classesInTest.reduce((s, c) => s + c.support, 0);
  const totalSupportW = classesInTest.reduce((s, c) => s + c.support_weighted, 0);

  const weightedF1 = totalSupport > 0
    ? classesInTest.reduce((s, c) => s + c.f1 * c.support, 0) / totalSupport
    : 0;
  const weightedF1W = totalSupportW > 0
    ? classesInTest.reduce((s, c) => s + c.f1_weighted * c.support_weighted, 0) / totalSupportW
    : 0;

  console.log('─── Weighted F1 (per-class F1 зважений на support) ────────\n');
  console.log(`  Незважений: ${(weightedF1 * 100).toFixed(2)}%`);
  console.log(`  Зважений:   ${(weightedF1W * 100).toFixed(2)}%\n`);

  // ─── 7. Топ-15 найгірших класів ───────────────────────────────

  const worstClasses = [...classesInTest]
    .filter(c => c.support >= 2)
    .sort((a, b) => a.f1 - b.f1)
    .slice(0, 15);

  console.log('─── Топ-15 найгірших класів за F1 (support ≥ 2) ───────────\n');
  console.log('  ' + 'Клас'.padEnd(55) + 'TP'.padStart(5) + 'FP'.padStart(5) + 'FN'.padStart(5) + 'F1'.padStart(8));
  console.log('  ' + '─'.repeat(78));
  for (const c of worstClasses) {
    const name = c.common_name.length > 52 ? c.common_name.slice(0, 49) + '...' : c.common_name;
    console.log(
      `  ${name.padEnd(55)}` +
      `${c.tp.toString().padStart(5)}` +
      `${c.fp.toString().padStart(5)}` +
      `${c.fn.toString().padStart(5)}` +
      `${(c.f1 * 100).toFixed(1).padStart(7)}%`
    );
  }

  // ─── 8. Зведена таблиця для диплому ───────────────────────────

  console.log('\n─── ЗВЕДЕНА ТАБЛИЦЯ ДЛЯ ДИПЛОМУ ────────────────────────────\n');

  const rows = [
    ['Метрика',                      'Зважена',                                       'Незважена'],
    ['─',                            '─',                                              '─'],
    ['Accuracy Top-1',               `${(wTop1.top1_accuracy*100).toFixed(2)}%`,       `${(uTop1.top1_accuracy*100).toFixed(2)}%`],
    ['Accuracy Top-3',               `${(wTop1.top3_accuracy*100).toFixed(2)}%`,       `${(uTop1.top3_accuracy*100).toFixed(2)}%`],
    ['Accuracy Top-5',               `${(wTop1.top5_accuracy*100).toFixed(2)}%`,       `${(uTop1.top5_accuracy*100).toFixed(2)}%`],
    ['─',                            '─',                                              '─'],
    ['Micro Precision',              `${(mwTop1.precision*100).toFixed(2)}%`,          `${(muTop1.precision*100).toFixed(2)}%`],
    ['Micro Recall',                 `${(mwTop1.recall*100).toFixed(2)}%`,             `${(muTop1.recall*100).toFixed(2)}%`],
    ['Micro F1',                     `${(mwTop1.f1*100).toFixed(2)}%`,                 `${(muTop1.f1*100).toFixed(2)}%`],
    ['─',                            '─',                                              '─'],
    ['Macro Precision',              `${(macroPrecisionW*100).toFixed(2)}%`,           `${(macroPrecision*100).toFixed(2)}%`],
    ['Macro Recall',                 `${(macroRecallW*100).toFixed(2)}%`,              `${(macroRecall*100).toFixed(2)}%`],
    ['Macro F1',                     `${(macroF1W*100).toFixed(2)}%`,                  `${(macroF1*100).toFixed(2)}%`],
    ['─',                            '─',                                              '─'],
    ['Weighted F1 (по support)',     `${(weightedF1W*100).toFixed(2)}%`,               `${(weightedF1*100).toFixed(2)}%`],
    ['─',                            '─',                                              '─'],
    ['Класів у тесті',               classesInTest.length.toString(),                  classesInTest.length.toString()],
    ['Унікальних комбінацій',        '—',                                              uTop1.total.toLocaleString()],
    ['Рядків у тесті',               wTop1.total.toLocaleString(),                     '—'],
  ];

  for (const [label, weighted, unweighted] of rows) {
    if (label === '─') {
      console.log('  ' + '─'.repeat(70));
    } else {
      console.log(
        `  ${label.padEnd(28)}` +
        `${weighted.padStart(20)}` +
        `${unweighted.padStart(20)}`
      );
    }
  }

  // ─── 9. Збереження у JSON ─────────────────────────────────────

  const output = {
    timestamp: new Date().toISOString(),
    classes_in_test: classesInTest.length,
    accuracy: {
      weighted: { top1: wTop1.top1_accuracy, top3: wTop1.top3_accuracy, top5: wTop1.top5_accuracy },
      unweighted: { top1: uTop1.top1_accuracy, top3: uTop1.top3_accuracy, top5: uTop1.top5_accuracy },
    },
    micro_f1: {
      weighted: { precision: mwTop1.precision, recall: mwTop1.recall, f1: mwTop1.f1 },
      unweighted: { precision: muTop1.precision, recall: muTop1.recall, f1: muTop1.f1 },
    },
    macro_f1: {
      weighted: { precision: macroPrecisionW, recall: macroRecallW, f1: macroF1W },
      unweighted: { precision: macroPrecision, recall: macroRecall, f1: macroF1 },
    },
    weighted_f1_by_support: { weighted: weightedF1W, unweighted: weightedF1 },
    per_class: perClass.sort((a, b) => a.f1 - b.f1),
  };

  const outPath = './output/metrics_report.json';
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n  Збережено: ${outPath}\n`);
}

const isMainModule = fileURLToPath(import.meta.url) === argv[1];
if (isMainModule) {
  main();
}