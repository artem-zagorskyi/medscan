// LLM classification tester — OpenAI / Gemini
//
// Запуск:
//   node classify.js --provider openai --csv dataset.csv
//   node classify.js --provider gemini --csv dataset.csv --limit 20
//
// Прапори:
//   --provider     openai | gemini       (обов'язково)
//   --csv          шлях до CSV           (обов'язково)
//   --model        назва моделі          (default: gpt-5-nano / gemini-2.0-flash)
//   --limit        N унікальних кортежів (для smoke-test)
//   --concurrency  паралельних запитів   (default: 8)
//   --delay        мс затримки на воркера (default: 0)
//   --out          префікс output файлів (default: results_<provider>)
//
// API ключі читаються з .env: OPENAI_API_KEY / GEMINI_API_KEY
// або з environment напряму.
//
// Output:
//   <out>_raw.json      — сирі відповіді LLM (на випадок resume / повторного аналізу)
//   <out>_report.md     — метрики (accuracy, F1 macro/weighted, per-class, топ помилок)
//   <out>_errors.csv    — тільки помилкові класифікації, відсортовані за впливом

import 'dotenv/config';
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

// ─── CLI ────────────────────────────────────────────────────────────────────
const args = parseArgs(process.argv.slice(2));
const PROVIDER = args.provider;
const CSV_PATH = args.csv;
const LIMIT = args.limit ? parseInt(args.limit, 10) : null;
const DELAY_MS = args.delay ? parseInt(args.delay, 10) : 0;
const CONCURRENCY = args.concurrency ? parseInt(args.concurrency, 10) : 4;
const OUT_PREFIX = args.out || `results_${PROVIDER}`;

if (!['openai', 'gemini'].includes(PROVIDER)) {
  console.error('❌ --provider openai|gemini'); process.exit(1);
}
if (!CSV_PATH || !fs.existsSync(CSV_PATH)) {
  console.error(`❌ CSV не знайдено: ${CSV_PATH}`); process.exit(1);
}

const MODEL = args.model || (PROVIDER === 'openai' ? 'gpt-5-nano' : 'gemini-2.0-flash');
const API_KEY = PROVIDER === 'openai' ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error(`❌ Не знайдено ${PROVIDER === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY'}`);
  process.exit(1);
}

// ─── Prompts ────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Ти — медичний експерт-класифікатор лабораторних досліджень.
Твоя задача: на основі неякісної назви дослідження, категорії, типу зразка та одиниць виміру
обрати ОДИН правильний клас зі списку наданих класів.

ПРАВИЛА КЛАСИФІКАЦІЇ:

1. Неякісна назва ("Назва" в інпуті) може бути:
   - Скороченням або абревіатурою (наприклад "RBC", "Hb", "ALP", "TBIL", "MCV")
   - Українським/російським синонімом або сленгом
   - Назвою категорії, органу або спеціальності (наприклад "Печінка", "Опорно-руховий", "Ортопедія") — у такому випадку шукай аналіз, який типово призначають у цій сфері
   - Назвою хімічної речовини або її форми

2. ОБОВ'ЯЗКОВО враховуй "Тип зразка" (fluid):
   - Якщо зразок "Сеча" — клас МАЄ бути про сечу, НЕ про сироватку/плазму/кров
   - Якщо зразок "Кров" або "Сироватка" — клас МАЄ відповідати крові/сироватці/плазмі
   - Невідповідність типу зразка — груба помилка

3. Одиниці виміру дають сильну підказку:
   - "%" часто означає об'ємну частку (Гематокрит) або відсоток
   - "IU/L", "U/L" — ензиматична активність
   - "mg/dL", "g/dL" — масова концентрація
   - відсутні одиниці — часто якісний аналіз (Наявність/Виявлено)

4. Категорія звужує пошук:
   - "Гематологія" — клітини крові, гемоглобін, гематокрит
   - "Хімія" — біохімія, ензими, метаболіти, токсикологія
   - "Мікробіологія" — бактерії, патогени

ФОРМАТ ВІДПОВІДІ:
- Уважно перегляньте повний список класів — правильна відповідь МОЖЕ бути в кінці списку.
- Обирай ТІЛЬКИ зі списку наданих класів, точне співпадіння символ-в-символ.
- НЕ вигадуй нові класи, НЕ модифікуй назви.
- Повертай СТРОГО JSON: {"predicted_class": "точна_назва_класу_зі_списку"}
- Жодного додаткового тексту, пояснень, markdown — тільки JSON.`;

const buildUserPrompt = (item, classes) => `Інформація про дослідження:
- Назва (неякісна): ${item.unofficial_name || '(відсутня)'}
- Категорія: ${item.category || '(відсутня)'}
- Тип зразка: ${item.fluid || '(відсутній)'}
- Одиниці виміру: ${item.unit || '(відсутні)'}

Список можливих класів (обери рівно ОДИН):
${classes.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Поверни JSON: {"predicted_class": "..."}`;

// ─── Providers ──────────────────────────────────────────────────────────────
// GPT-5 (включаючи nano/mini) — reasoning models, не приймають temperature
const IS_GPT5 = PROVIDER === 'openai' && MODEL.startsWith('gpt-5');

async function callOpenAI(item, classes) {
  return await withRetry(async () => {
    const t0 = Date.now();
    const reqBody = {
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(item, classes) },
      ],
      response_format: { type: 'json_object' },
    };
    if (!IS_GPT5) {
      reqBody.temperature = 0; // GPT-5 фіксують temperature на 1
    } else {
      // Для класифікації не потрібен глибокий reasoning — економимо output-токени
      reqBody.reasoning_effort = 'minimal';
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(reqBody),
    });
    const latency = Date.now() - t0;
    if (!r.ok) return { ok: false, status: r.status, errText: await r.text(), retryAfter: r.headers.get('retry-after'), latency };
    const d = await r.json();
    const raw = d?.choices?.[0]?.message?.content ?? '';
    const usage = d?.usage ?? null;
    return { ok: true, raw, usage, latency };
  });
}

async function callGemini(item, classes) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  return await withRetry(async () => {
    const t0 = Date.now();
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: buildUserPrompt(item, classes) }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
    });
    const latency = Date.now() - t0;
    if (!r.ok) return { ok: false, status: r.status, errText: await r.text(), retryAfter: r.headers.get('retry-after'), latency };
    const d = await r.json();
    const raw = d?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const usage = d?.usageMetadata ?? null;
    return { ok: true, raw, usage, latency };
  });
}

// Універсальний retry з exponential backoff для 429/5xx.
// Викликає fn() яка повертає { ok, raw?, usage?, latency, status?, errText?, retryAfter? }.
// На вихід — { raw, error, latency_ms, usage }. Парсинг + fuzzy match робиться зовні.
async function withRetry(fn) {
  const MAX_ATTEMPTS = 8;
  let lastErr = null;
  let totalLatency = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let result;
    try {
      result = await fn();
    } catch (e) {
      result = { ok: false, status: 0, errText: e.message, retryAfter: null, latency: 0 };
    }
    totalLatency += result.latency || 0;

    if (result.ok) {
      return { raw: result.raw, error: null, latency_ms: totalLatency, usage: result.usage };
    }

    const retriable = result.status === 429 || result.status >= 500 || result.status === 0;
    lastErr = `HTTP ${result.status}: ${(result.errText || '').slice(0, 200)}`;
    if (!retriable || attempt === MAX_ATTEMPTS) {
      return { raw: '', error: lastErr, latency_ms: totalLatency, usage: null };
    }

    // Backoff: пріоритет — Retry-After header (OpenAI каже скільки чекати).
    // Інакше exponential з більшою базою для 429 (TPM/RPM rate limits часто потребують 30-60s).
    let waitMs;
    if (result.retryAfter) {
      const ra = parseFloat(result.retryAfter);
      waitMs = isNaN(ra) ? 5000 * Math.pow(2, attempt) : ra * 1000;
    } else if (result.status === 429) {
      // Для 429 — агресивний backoff: 5, 10, 20, 40, 60, 60, 60, 60
      waitMs = Math.min(60000, 5000 * Math.pow(2, attempt - 1));
    } else {
      // Для 5xx/network — звичайний exponential
      waitMs = Math.min(30000, 2000 * Math.pow(2, attempt - 1));
    }
    waitMs += Math.floor(Math.random() * 1000); // jitter

    process.stdout.write(`\n   ⏳ ${result.status} → retry ${attempt}/${MAX_ATTEMPTS - 1} через ${(waitMs / 1000).toFixed(1)}s... `);
    await sleep(waitMs);
  }

  return { raw: '', error: lastErr, latency_ms: totalLatency, usage: null };
}

// Парсимо JSON відповідь і робимо fuzzy-match до списку класів.
// Повертає: { raw_predicted, matched, match_type }
//   raw_predicted — що буквально сказала модель
//   matched       — фінальний клас (точне співпадіння АБО найближчий зі списку)
//   match_type    — 'exact' | 'fuzzy' | 'no_match' | 'parse_fail'
function parseAndMatch(raw, classes) {
  if (!raw) return { raw_predicted: null, matched: null, match_type: 'parse_fail' };
  const cleaned = raw.replace(/```json|```/g, '').trim();
  let predicted;
  try {
    const obj = JSON.parse(cleaned);
    predicted = typeof obj.predicted_class === 'string' ? obj.predicted_class.trim() : null;
  } catch {
    return { raw_predicted: null, matched: null, match_type: 'parse_fail' };
  }
  if (!predicted) return { raw_predicted: null, matched: null, match_type: 'parse_fail' };

  // 1) Точне співпадіння
  if (classes.includes(predicted)) {
    return { raw_predicted: predicted, matched: predicted, match_type: 'exact' };
  }

  // 2) Нормалізоване співпадіння (case-insensitive, без пробілів по краях)
  const normPredicted = predicted.toLowerCase().trim();
  const exactNormHit = classes.find(c => c.toLowerCase().trim() === normPredicted);
  if (exactNormHit) {
    return { raw_predicted: predicted, matched: exactNormHit, match_type: 'exact' };
  }

  // 3) Fuzzy match — Levenshtein, нормалізований на довжину
  // Поріг 0.25 = до 25% символів відрізняються (типу "Креатинін" vs "Кретаtинін")
  const FUZZY_THRESHOLD = 0.25;
  let best = null, bestScore = Infinity;
  for (const c of classes) {
    const score = normalizedLevenshtein(predicted.toLowerCase(), c.toLowerCase());
    if (score < bestScore) { bestScore = score; best = c; }
  }
  if (best && bestScore <= FUZZY_THRESHOLD) {
    return { raw_predicted: predicted, matched: best, match_type: 'fuzzy' };
  }

  return { raw_predicted: predicted, matched: null, match_type: 'no_match' };
}

// Levenshtein distance, нормалізована на максимальну довжину рядка (0 = identical, 1 = totally different)
function normalizedLevenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length || !b.length) return 1;
  const maxLen = Math.max(a.length, b.length);
  return levenshtein(a, b) / maxLen;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  // Two-row DP — економить пам'ять
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,      // insertion
        prev[j] + 1,          // deletion
        prev[j - 1] + cost    // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

const classify = PROVIDER === 'openai' ? callOpenAI : callGemini;

// ─── Читаємо CSV + дедуплікація ─────────────────────────────────────────────
console.log(`📂 ${CSV_PATH}`);
const records = parse(fs.readFileSync(CSV_PATH, 'utf-8'), { columns: true, skip_empty_lines: true });
console.log(`   Рядків: ${records.length}`);

const classes = [...new Set(records.map(r => r.common_name).filter(Boolean))];
console.log(`   Класів (unique common_name): ${classes.length}`);

// Ключ = unofficial_name + category + fluid + unit
const dedup = new Map();
records.forEach((r, idx) => {
  const item = {
    unofficial_name: (r.unofficial_name || '').trim(),
    category: (r.category || '').trim(),
    fluid: (r.fluid || '').trim(),
    unit: (r.unit || '').trim(),
  };
  const key = `${item.unofficial_name}||${item.category}||${item.fluid}||${item.unit}`;
  if (!dedup.has(key)) dedup.set(key, { key, item, truth: r.common_name, indices: [] });
  dedup.get(key).indices.push(idx);
});

let tasks = [...dedup.values()];
console.log(`   Унікальних кортежів: ${tasks.length} (економія ${((1 - tasks.length / records.length) * 100).toFixed(1)}%)`);
if (LIMIT) { tasks = tasks.slice(0, LIMIT); console.log(`   ⚠️  LIMIT=${LIMIT}`); }

// ─── Основний цикл (worker pool) ────────────────────────────────────────────
console.log(`\n🚀 ${PROVIDER} (${MODEL}), concurrency=${CONCURRENCY}, delay=${DELAY_MS}ms\n`);
const RAW_PATH = `${OUT_PREFIX}_raw.json`;

// Ціни (per 1M tokens, USD). Можна оверайдити через --in-price / --out-price.
const PRICES = {
  // GPT-5 (reasoning) — серпень 2025
  'gpt-5':         { input: 0.625, cachedInput: 0.0625, output: 5.00 },
  'gpt-5-mini':    { input: 0.25,  cachedInput: 0.025,  output: 2.00 },
  'gpt-5-nano':    { input: 0.05,  cachedInput: 0.005,  output: 0.40 },
  // GPT-5.4 — березень 2026
  'gpt-5.4':       { input: 2.50,  cachedInput: 0.25,   output: 15.00 },
  'gpt-5.4-mini':  { input: 0.75,  cachedInput: 0.075,  output: 4.50 },
  'gpt-5.4-nano':  { input: 0.20,  cachedInput: 0.02,   output: 1.25 },
  // GPT-4.1 family
  'gpt-4.1':       { input: 2.00,  cachedInput: 0.50,   output: 8.00 },
  'gpt-4.1-mini':  { input: 0.40,  cachedInput: 0.10,   output: 1.60 },
  'gpt-4.1-nano':  { input: 0.10,  cachedInput: 0.025,  output: 0.40 },
  // Старші моделі
  'gpt-4o':        { input: 2.50,  cachedInput: 1.25,   output: 10.00 },
  'gpt-4o-mini':   { input: 0.15,  cachedInput: 0.075,  output: 0.60 },
};
const price = PRICES[MODEL] || null;
if (price) console.log(`   💰 Ціни (per 1M tok): in=$${price.input} / cached=$${price.cachedInput} / out=$${price.output}\n`);
else console.log(`   ⚠️  Ціни для ${MODEL} невідомі — usage буде логуватись, але без $$\n`);

// Розділяємий стан між воркерами
const results = new Array(tasks.length); // зберігаємо в порядку tasks, а не завершення
let nextTaskIdx = 0;
let completed = 0;
let totalInputTokens = 0, totalCachedTokens = 0, totalOutputTokens = 0;
let exactCount = 0, fuzzyCount = 0, noMatchCount = 0, parseFailCount = 0;
let errorCount = 0;
const t0 = Date.now();

// Один воркер у пулі: тягне задачі з черги доки вона не пуста
async function worker(workerId) {
  while (true) {
    const myIdx = nextTaskIdx++;
    if (myIdx >= tasks.length) return;
    const task = tasks[myIdx];

    const res = await classify(task.item, classes);
    const { raw_predicted, matched, match_type } = parseAndMatch(res.raw, classes);

    // Підрахунок статистики (стан спільний, але JS однопотоковий — race conditions немає)
    if (match_type === 'exact') exactCount++;
    else if (match_type === 'fuzzy') fuzzyCount++;
    else if (match_type === 'no_match') noMatchCount++;
    else if (match_type === 'parse_fail') parseFailCount++;
    if (res.error) errorCount++;

    if (res.usage) {
      let inTok, cachedTok, outTok;
      if (PROVIDER === 'openai') {
        inTok = res.usage.prompt_tokens || 0;
        cachedTok = res.usage.prompt_tokens_details?.cached_tokens || 0;
        outTok = res.usage.completion_tokens || 0;
      } else {
        inTok = res.usage.promptTokenCount || 0;
        cachedTok = res.usage.cachedContentTokenCount || 0;
        outTok = res.usage.candidatesTokenCount || 0;
      }
      totalInputTokens += inTok - cachedTok;
      totalCachedTokens += cachedTok;
      totalOutputTokens += outTok;
    }

    results[myIdx] = {
      key: task.key, item: task.item, truth: task.truth,
      raw_predicted, predicted: matched, match_type,
      raw: res.raw, error: res.error,
      latency_ms: res.latency_ms, indices_count: task.indices.length,
      usage: res.usage,
    };

    completed++;
    // Прогрес: компактний рядок, оновлюється кожні N задач
    if (completed % 5 === 0 || completed === tasks.length) {
      const cost = price ? estimateCost(totalInputTokens, totalCachedTokens, totalOutputTokens, price) : null;
      const costStr = cost !== null ? ` $${cost.toFixed(3)}` : '';
      const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
      const eta = completed > 0 ? Math.round((Date.now() - t0) / completed * (tasks.length - completed) / 1000) : 0;
      const stats = `✅${exactCount + fuzzyCount} ❗${noMatchCount} ❌${errorCount}`;
      process.stdout.write(`\r[${completed}/${tasks.length}]${costStr} ${stats} | ${elapsed}s elapsed, ~${eta}s left   `);
    }

    // Зберігаємо прогрес кожні 50 задач (відфільтрувавши undefined зі ще не оброблених слотів)
    if (completed % 50 === 0) {
      saveRaw(results.filter(Boolean));
    }

    if (DELAY_MS > 0) await sleep(DELAY_MS);
  }
}

// Запускаємо CONCURRENCY воркерів паралельно
const workers = [];
for (let i = 0; i < Math.min(CONCURRENCY, tasks.length); i++) {
  workers.push(worker(i));
}
await Promise.all(workers);

// Фінальне збереження
saveRaw(results);

const finalCost = price ? estimateCost(totalInputTokens, totalCachedTokens, totalOutputTokens, price) : null;
console.log(`\n\n✅ ${((Date.now() - t0) / 1000).toFixed(1)}s → ${RAW_PATH}`);
console.log(`\n🎯 MATCH TYPES (на ${results.length} запитах):`);
console.log(`   exact:      ${exactCount}\t(модель повернула точну назву класу)`);
console.log(`   fuzzy:      ${fuzzyCount}\t(Levenshtein < 25%, виправили опечатки/латиницю)`);
console.log(`   no_match:   ${noMatchCount}\t(модель вигадала клас, далекий від списку)`);
console.log(`   parse_fail: ${parseFailCount}\t(не вдалось розпарсити JSON)`);
console.log(`   api_errors: ${errorCount}\t(HTTP/мережеві помилки)`);

console.log(`\n💰 USAGE:`);
console.log(`   Input (non-cached): ${totalInputTokens.toLocaleString()} токенів`);
console.log(`   Cached input:       ${totalCachedTokens.toLocaleString()} токенів`);
console.log(`   Output:             ${totalOutputTokens.toLocaleString()} токенів`);
if (finalCost !== null) console.log(`   ИТОГО:              $${finalCost.toFixed(4)}`);

// ─── Розкатуємо на всі рядки і рахуємо метрики ──────────────────────────────
const rows = [];
for (const r of results) {
  const t = dedup.get(r.key);
  for (const idx of t.indices) {
    rows.push({ truth: records[idx].common_name, predicted: r.predicted });
  }
}
const m = computeMetrics(rows);

console.log('\n📊 МЕТРИКИ:');
console.log(`   Accuracy:    ${(m.accuracy * 100).toFixed(2)}% (${m.correct}/${m.total})`);
console.log(`   Macro F1:    ${(m.macro.f1 * 100).toFixed(2)}%`);
console.log(`   Weighted F1: ${(m.weighted.f1 * 100).toFixed(2)}%`);
console.log(`   Failed:      ${m.failed}`);

saveReport(m, results);
saveErrorsCsv(results);
console.log(`\n📄 ${OUT_PREFIX}_report.md`);
console.log(`📄 ${OUT_PREFIX}_errors.csv`);

// ════════════════════════════════════════════════════════════════════════════
// helpers

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

  // Macro / Weighted рахуємо тільки по класах що є в truth (інакше галюцинації моделі завищать знаменник)
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

function saveRaw(results) {
  fs.writeFileSync(RAW_PATH, JSON.stringify({
    provider: PROVIDER, model: MODEL, timestamp: new Date().toISOString(), results,
  }, null, 2), 'utf-8');
}

function saveReport(m, results) {
  const perClassRows = Object.entries(m.perClass)
    .sort((a, b) => b[1].support - a[1].support)
    .map(([c, x]) => `| ${c} | ${x.support} | ${(x.precision * 100).toFixed(1)}% | ${(x.recall * 100).toFixed(1)}% | ${(x.f1 * 100).toFixed(1)}% |`);
  const errRows = m.topErrors.slice(0, 30).map(e => `| ${e.pair} | ${e.count} |`);
  const avgLat = results.length ? (results.reduce((s, r) => s + (r.latency_ms || 0), 0) / results.length).toFixed(0) : 0;

  const md = `# Звіт класифікації — ${PROVIDER} (${MODEL})

Згенеровано: ${new Date().toISOString()}

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
| Failed (API/parse) | ${m.failed} |
| Унікальних кортежів | ${results.length} |
| Сер. latency | ${avgLat} ms |

## Per-class

| Клас | Support | Precision | Recall | F1 |
|---|---|---|---|---|
${perClassRows.join('\n')}

## Топ-30 помилок (truth → predicted)

| Пара | К-сть |
|---|---|
${errRows.join('\n')}
`;
  fs.writeFileSync(`${OUT_PREFIX}_report.md`, md, 'utf-8');
}

function saveErrorsCsv(results) {
  const rows = results
    .filter(r => r.predicted !== r.truth)
    .map(r => ({
      unofficial_name: r.item.unofficial_name,
      category: r.item.category,
      fluid: r.item.fluid,
      unit: r.item.unit,
      truth: r.truth,
      raw_predicted: r.raw_predicted ?? '(parse_fail)',  // що буквально сказала модель
      predicted: r.predicted ?? '(no_match)',             // після fuzzy
      match_type: r.match_type ?? '',
      affected_rows: r.indices_count,
      error: r.error ?? '',
    }))
    .sort((a, b) => b.affected_rows - a.affected_rows);
  fs.writeFileSync(`${OUT_PREFIX}_errors.csv`, stringify(rows, { header: true }), 'utf-8');
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    }
  }
  return out;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function estimateCost(inTok, cachedTok, outTok, price) {
  return (inTok / 1e6) * price.input
       + (cachedTok / 1e6) * price.cachedInput
       + (outTok / 1e6) * price.output;
}