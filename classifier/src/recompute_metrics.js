// Пересчитує метрики класифікації з уже збереженого _raw.json
// БЕЗ повторних запитів до API.
//
// Запуск:
//   node recompute_metrics.js results_openai_raw.json
//   node recompute_metrics.js results_openai_raw.json --csv ./output/test.csv
//
// Чому потрібен --csv:
//   _raw.json містить тільки унікальні кортежі (2201), а реальні метрики
//   рахуються на повних рядках CSV (137k). Без CSV ми втрачаємо вагу
//   кожного кортежу (indices_count) — хоча воно є в _raw, --csv дає
//   ground truth на рівні рядків.
//
// Output:
//   <prefix>_report_strict.md     — як було (failed = неправильна відповідь)
//   <prefix>_report_filtered.md   — failed виключені з підрахунку
//   <prefix>_report_imputed.md    — failed розподілені пропорційно

import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

const args = parseArgs(process.argv.slice(2));
const RAW_JSON_PATH = args._[0];
const CSV_PATH = args.csv;

if (!RAW_JSON_PATH || !fs.existsSync(RAW_JSON_PATH)) {
  console.error('❌ Вкажи шлях до _raw.json першим аргументом');
  console.error('   приклад: node recompute_metrics.js results_openai_raw.json --csv ./output/test.csv');
  process.exit(1);
}

const PREFIX = RAW_JSON_PATH.replace(/_raw\.json$/, '');
const data = JSON.parse(fs.readFileSync(RAW_JSON_PATH, 'utf-8'));
const { provider, model, results } = data;

console.log(`📂 ${RAW_JSON_PATH}`);
console.log(`   Provider: ${provider} (${model})`);
console.log(`   Унікальних кортежів у raw: ${results.length}`);

// ─── Будуємо row-level масив для метрик ─────────────────────────────────────
let rows = [];

if (CSV_PATH && fs.existsSync(CSV_PATH)) {
  // Маємо CSV — розкатуємо за tasks.indices як у основному скрипті
  const csvText = fs.readFileSync(CSV_PATH, 'utf-8');
  const records = parse(csvText, { columns: true, skip_empty_lines: true });
  console.log(`   CSV рядків: ${records.length}`);

  // Будуємо мапу key → predicted з results
  const predByKey = new Map();
  for (const r of results) {
    predByKey.set(r.key, { predicted: r.predicted, error: r.error });
  }

  // Розкатуємо
  for (const rec of records) {
    const item = {
      unofficial_name: (rec.unofficial_name || '').trim(),
      category: (rec.category || '').trim(),
      fluid: (rec.fluid || '').trim(),
      unit: (rec.unit || '').trim(),
    };
    const key = `${item.unofficial_name}||${item.category}||${item.fluid}||${item.unit}`;
    const pred = predByKey.get(key);
    if (!pred) continue; // якщо в raw.json не всі кортежі (наприклад прогін з --limit)
    rows.push({
      truth: rec.common_name,
      predicted: pred.predicted,
      error: pred.error,
    });
  }
  console.log(`   Розкатано до ${rows.length} рядків через CSV`);
} else {
  // Без CSV — використовуємо indices_count як вагу
  console.log(`   ⚠️  CSV не вказано — розкатую через indices_count`);
  for (const r of results) {
    for (let i = 0; i < (r.indices_count || 1); i++) {
      rows.push({ truth: r.truth, predicted: r.predicted, error: r.error });
    }
  }
  console.log(`   Розкатано до ${rows.length} рядків через indices_count`);
}

// ─── Три варіанти метрик ────────────────────────────────────────────────────
const total = rows.length;
const failedRows = rows.filter(r => r.predicted === null);
const successfulRows = rows.filter(r => r.predicted !== null);

console.log(`\n📊 Розподіл:`);
console.log(`   Всього рядків (weighted):    ${total}`);
console.log(`   Унікальних кортежів:         ${results.length}`);
console.log(`   Успішних рядків:             ${successfulRows.length} (${((successfulRows.length / total) * 100).toFixed(2)}%)`);
console.log(`   Failed рядків:               ${failedRows.length} (${((failedRows.length / total) * 100).toFixed(2)}%)`);

// === UNWEIGHTED метрики (на рівні унікальних кортежів) ===
// Кожен кортеж = 1 бал, незалежно від того скільки раз він зустрічається в CSV.
// Це показує "сирий" performance моделі на різноманітності задач.
const unweightedRows = results.map(r => ({
  truth: r.truth,
  predicted: r.predicted,
  error: r.error,
}));
const unweighted = computeMetrics(unweightedRows);

console.log(`\n━━━ UNWEIGHTED (на рівні унікальних кортежів, N=${results.length}) ━━━`);
console.log(`   1 кортеж = 1 бал, незалежно від частоти в CSV`);
printSummary(unweighted);

// === WEIGHTED STRICT (як було — failed = неправильні) ===
const strict = computeMetrics(rows);
console.log(`\n━━━ WEIGHTED STRICT (на рівні рядків CSV, N=${total}) ━━━`);
console.log(`   Failed = неправильна відповідь. Кортеж важить = скільки раз зустрічається в CSV`);
printSummary(strict);
saveReport(`${PREFIX}_report_strict.md`, strict, 'WEIGHTED STRICT', model, provider,
  'Метрики порахвані на рівні всіх рядків CSV. Failed запити (predicted = null) рахуються як неправильні класифікації. Це найбільш консервативна метрика — реальна якість моделі в production з урахуванням всіх збоїв API.');

// === WEIGHTED FILTERED (failed виключені) ===
const filtered = computeMetrics(successfulRows);
console.log(`\n━━━ WEIGHTED FILTERED (failed виключені) ━━━`);
printSummary(filtered);
saveReport(`${PREFIX}_report_filtered.md`, filtered, 'WEIGHTED FILTERED', model, provider,
  `Метрики порахвані тільки на ${successfulRows.length} успішних рядках. ${failedRows.length} failed (${((failedRows.length / total) * 100).toFixed(2)}%) виключені. Це верхня межа якості моделі — як би вона показала себе без обмежень rate-limit.`);

// === WEIGHTED IMPUTED (failed розподілені пропорційно) ===
const imputedRows = imputeFailed(rows, successfulRows);
const imputed = computeMetrics(imputedRows);
console.log(`\n━━━ WEIGHTED IMPUTED (failed розподілені пропорційно) ━━━`);
printSummary(imputed);
saveReport(`${PREFIX}_report_imputed.md`, imputed, 'WEIGHTED IMPUTED', model, provider,
  `Failed рядки (${failedRows.length}) розподілені пропорційно до успішних: припускаємо що вони мали б ту саму ймовірність правильної класифікації що й успішні (${(filtered.accuracy * 100).toFixed(2)}%). Це статистична оцінка — реальної відповіді ми не знаємо.`);

// Окремий звіт для unweighted
saveReport(`${PREFIX}_report_unweighted.md`, unweighted, 'UNWEIGHTED', model, provider,
  `Метрики на рівні унікальних кортежів (N=${results.length}). Кожен кортеж важить однаково, незалежно від того скільки разів він зустрічається в CSV. Це показує "сирий" performance моделі на різноманітності задач — наскільки добре вона справляється з кожним УНІКАЛЬНИМ випадком.`);

// === Порівняльна таблиця ===
console.log(`\n┌──────────────────────┬──────────┬──────────┬──────────┐`);
console.log(`│ Варіант              │ Accuracy │ Macro F1 │ Weight F1│`);
console.log(`├──────────────────────┼──────────┼──────────┼──────────┤`);
console.log(`│ Unweighted (по кортеж)│ ${pct(unweighted.accuracy)} │ ${pct(unweighted.macro.f1)} │ ${pct(unweighted.weighted.f1)} │`);
console.log(`│ Weighted Strict      │ ${pct(strict.accuracy)} │ ${pct(strict.macro.f1)} │ ${pct(strict.weighted.f1)} │`);
console.log(`│ Weighted Filtered    │ ${pct(filtered.accuracy)} │ ${pct(filtered.macro.f1)} │ ${pct(filtered.weighted.f1)} │`);
console.log(`│ Weighted Imputed     │ ${pct(imputed.accuracy)} │ ${pct(imputed.macro.f1)} │ ${pct(imputed.weighted.f1)} │`);
console.log(`└──────────────────────┴──────────┴──────────┴──────────┘`);

console.log(`\n📄 Звіти:`);
console.log(`   ${PREFIX}_report_unweighted.md`);
console.log(`   ${PREFIX}_report_strict.md`);
console.log(`   ${PREFIX}_report_filtered.md`);
console.log(`   ${PREFIX}_report_imputed.md`);

// ════════════════════════════════════════════════════════════════════════════
// helpers

function pct(x) { return `${(x * 100).toFixed(2)}%`.padStart(8); }

function printSummary(m) {
  console.log(`   Accuracy:    ${pct(m.accuracy)}  (${m.correct}/${m.total})`);
  console.log(`   Macro F1:    ${pct(m.macro.f1)}`);
  console.log(`   Weighted F1: ${pct(m.weighted.f1)}`);
}

/**
 * Для кожного failed-рядка симулюємо predicted на основі розподілу
 * successful: з ймовірністю acc_successful → predicted = truth (правильно),
 *             інакше → predicted = випадковий неправильний клас з тих,
 *             що successful модель помилково повертала на цей truth.
 *
 * Без сіду використовуємо Math.random — детермінізм можна додати при потребі.
 */
function imputeFailed(allRows, successfulRows) {
  const accSuccessful = successfulRows.length > 0
    ? successfulRows.filter(r => r.predicted === r.truth).length / successfulRows.length
    : 0;

  // Для кожного truth-класу збираємо які НЕправильні предикції давала модель.
  // Якщо truth не зустрічався серед successful — fallback на загальний розподіл predicted.
  const wrongPredsByTruth = new Map();
  const globalWrongPreds = [];
  for (const r of successfulRows) {
    if (r.predicted !== r.truth) {
      if (!wrongPredsByTruth.has(r.truth)) wrongPredsByTruth.set(r.truth, []);
      wrongPredsByTruth.get(r.truth).push(r.predicted);
      globalWrongPreds.push(r.predicted);
    }
  }

  return allRows.map(r => {
    if (r.predicted !== null) return r; // успішні залишаємо як є
    // failed → симулюємо
    if (Math.random() < accSuccessful) {
      return { ...r, predicted: r.truth };
    } else {
      const pool = wrongPredsByTruth.get(r.truth) || globalWrongPreds;
      const fakePred = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : 'IMPUTED_UNKNOWN';
      return { ...r, predicted: fakePred };
    }
  });
}

function computeMetrics(rows) {
  const total = rows.length;
  const correct = rows.filter(r => r.predicted === r.truth).length;
  const failed = rows.filter(r => r.predicted === null).length;
  const accuracy = total ? correct / total : 0;

  const allClasses = new Set();
  rows.forEach(r => { allClasses.add(r.truth); if (r.predicted) allClasses.add(r.predicted); });

  const perClass = {};
  for (const c of allClasses) {
    let tp = 0, fp = 0, fn = 0, support = 0;
    for (const r of rows) {
      if (r.truth === c) support++;
      if (r.predicted === c && r.truth === c) tp++;
      else if (r.predicted === c && r.truth !== c) fp++;
      else if (r.predicted !== c && r.truth === c) fn++;
    }
    const p = (tp + fp) ? tp / (tp + fp) : 0;
    const rec = (tp + fn) ? tp / (tp + fn) : 0;
    const f1 = (p + rec) ? (2 * p * rec) / (p + rec) : 0;
    perClass[c] = { precision: p, recall: rec, f1, support, tp, fp, fn };
  }

  const truthCls = Object.entries(perClass).filter(([, x]) => x.support > 0);
  const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
  const macro = {
    precision: avg(truthCls.map(([, x]) => x.precision)),
    recall: avg(truthCls.map(([, x]) => x.recall)),
    f1: avg(truthCls.map(([, x]) => x.f1)),
  };
  const totalSup = truthCls.reduce((s, [, x]) => s + x.support, 0) || 1;
  const weighted = {
    precision: truthCls.reduce((s, [, x]) => s + x.precision * x.support, 0) / totalSup,
    recall: truthCls.reduce((s, [, x]) => s + x.recall * x.support, 0) / totalSup,
    f1: truthCls.reduce((s, [, x]) => s + x.f1 * x.support, 0) / totalSup,
  };

  const conf = {};
  for (const r of rows) {
    if (r.predicted !== r.truth) {
      const k = `${r.truth} → ${r.predicted ?? '(FAILED)'}`;
      conf[k] = (conf[k] || 0) + 1;
    }
  }
  const topErrors = Object.entries(conf).sort((a, b) => b[1] - a[1]).map(([pair, count]) => ({ pair, count }));

  return { total, correct, failed, accuracy, macro, weighted, perClass, topErrors };
}

function saveReport(path, m, variant, model, provider, description) {
  const perClassRows = Object.entries(m.perClass)
    .sort((a, b) => b[1].support - a[1].support)
    .map(([c, x]) => `| ${c} | ${x.support} | ${(x.precision * 100).toFixed(1)}% | ${(x.recall * 100).toFixed(1)}% | ${(x.f1 * 100).toFixed(1)}% |`);
  const errRows = m.topErrors.slice(0, 30).map(e => `| ${e.pair} | ${e.count} |`);

  const md = `# Звіт класифікації — ${provider} (${model}) — ${variant}

Згенеровано: ${new Date().toISOString()}

> ${description}

## Загальні метрики

| Метрика | Значення |
|---|---|
| **Accuracy** | **${(m.accuracy * 100).toFixed(2)}%** (${m.correct} / ${m.total}) |
| Macro Precision | ${(m.macro.precision * 100).toFixed(2)}% |
| Macro Recall | ${(m.macro.recall * 100).toFixed(2)}% |
| **Macro F1** | **${(m.macro.f1 * 100).toFixed(2)}%** |
| Weighted Precision | ${(m.weighted.precision * 100).toFixed(2)}% |
| Weighted Recall | ${(m.weighted.recall * 100).toFixed(2)}% |
| **Weighted F1** | **${(m.weighted.f1 * 100).toFixed(2)}%** |
| Failed (predicted=null) | ${m.failed} |

## Per-class

| Клас | Support | Precision | Recall | F1 |
|---|---|---|---|---|
${perClassRows.join('\n')}

## Топ-30 помилок (truth → predicted)

| Пара | К-сть |
|---|---|
${errRows.join('\n')}
`;
  fs.writeFileSync(path, md, 'utf-8');
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else {
      out._.push(a);
    }
  }
  return out;
}