// Самодостатній тест — НЕ використовує top-level await, працює і в ESM і в CommonJS.
// Запуск: node test_model.js [model_name]
//
// Перевіряє з .env (якщо є dotenv) АБО з environment variable напряму.

(async () => {
  try {
    // Намагаємось завантажити dotenv якщо доступний
    try {
      const dotenv = await import('dotenv');
      dotenv.config();
    } catch (e) {
      console.log('ℹ️  dotenv не знайдено — читаю ключ напряму з env');
    }

    const API_KEY = process.env.OPENAI_API_KEY;
    if (!API_KEY) {
      console.error('❌ OPENAI_API_KEY не заданий ані в .env, ані в env');
      process.exit(1);
    }
    console.log(`✓ API key знайдено: ${API_KEY.slice(0, 10)}...${API_KEY.slice(-4)}`);

    const MODEL = process.argv[2] || 'gpt-5-nano';
    console.log(`✓ Модель: ${MODEL}\n`);

    // Тест 1: без temperature, без response_format — найпростіший базовий запит
    console.log('═══ Тест 1: базовий запит (без temperature, без response_format) ═══');
    await testRequest(API_KEY, MODEL, {
      model: MODEL,
      messages: [
        { role: 'user', content: 'Say hello in JSON: {"greeting": "..."}' },
      ],
    });

    // Тест 2: з response_format json_object
    console.log('\n═══ Тест 2: + response_format: json_object ═══');
    await testRequest(API_KEY, MODEL, {
      model: MODEL,
      messages: [
        { role: 'user', content: 'Say hello in JSON: {"greeting": "..."}' },
      ],
      response_format: { type: 'json_object' },
    });

    // Тест 3: з temperature: 0
    console.log('\n═══ Тест 3: + temperature: 0 ═══');
    await testRequest(API_KEY, MODEL, {
      model: MODEL,
      messages: [
        { role: 'user', content: 'Say hello in JSON: {"greeting": "..."}' },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

  } catch (e) {
    console.error('❌ Скрипт упав з помилкою:');
    console.error(e);
    process.exit(1);
  }
})();

async function testRequest(apiKey, model, body) {
  console.log('→ Відправляю:', JSON.stringify(body, null, 2).slice(0, 300));
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    console.log(`← Status: ${r.status} ${r.statusText}`);
    console.log('← Body:');
    console.log(text);
    if (r.ok) console.log('✅ OK');
    else console.log('❌ FAIL');
  } catch (e) {
    console.error('❌ Network error:', e.message);
  }
}