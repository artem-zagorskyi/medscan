import 'dotenv/config';

const OLLAMA_URL = process.env.OLLAMA_URL.replace(/\/+$/, ''); // убираем хвостовые слэши
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL;
const TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS || '30000', 10);
const MAX_RETRIES = parseInt(process.env.OLLAMA_MAX_RETRIES || '3', 10);

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getEmbedding(text) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `${OLLAMA_URL}/api/embeddings`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: EMBEDDING_MODEL,
            prompt: text,
          }),
        },
        TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error(`Некорректный ответ: ${JSON.stringify(data).slice(0, 200)}`);
      }

      return data.embedding;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        const delayMs = 1000 * attempt; // 1с, 2с, 3с
        console.warn(`Попытка ${attempt} провалилась: ${err.message}. Повтор через ${delayMs}мс...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(`Не удалось получить embedding после ${MAX_RETRIES} попыток: ${lastError.message}`);
}

export async function generateKeywords(unofficialName, category, fluid, unit) {
  const prompt = `Лабораторний тест "${unofficialName}" (${category || '?'}, ${fluid || '?'}, ${unit || '?'}).
Напиши ТІЛЬКИ список ключових слів через кому: повна назва українською, назва англійською, абревіатури, хімічна формула, група аналізів, що вимірює. Без пояснень, без речень.

Ключові слова:`;

  const TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS || '30000', 10);
  const MAX_RETRIES = parseInt(process.env.OLLAMA_MAX_RETRIES || '3', 10);
  const SLM_MODEL = process.env.SLM_MODEL;

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model: SLM_MODEL,
            prompt,
            stream: false,
            options: { temperature: 0, num_predict: 100 },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const raw = (data.response || '').trim();

        // Очистка від markdown
        return raw
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/^#+\s*/gm, '')
          .replace(/^[-•]\s*/gm, '')
          .replace(/\n+/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        const delayMs = 1000 * attempt;
        console.warn(`  generateKeywords попытка ${attempt} провалилась: ${err.message}. Повтор через ${delayMs}мс...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(`generateKeywords провалилась після ${MAX_RETRIES} спроб: ${lastError.message}`);
}