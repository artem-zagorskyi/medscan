import 'dotenv/config';

export const config = {
  ollama: {
    url: process.env.OLLAMA_URL.replace(/\/+$/, ''),
    embeddingModel: process.env.EMBEDDING_MODEL,
    slmModel: process.env.SLM_MODEL,
    timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '30000', 10),
    maxRetries: parseInt(process.env.OLLAMA_MAX_RETRIES || '3', 10),
  },
  paths: {
    dataset: process.env.DATASET_PATH,
    shuffled: process.env.SHUFFLED_PATH,
    train: process.env.TRAIN_PATH,
    test: process.env.TEST_PATH,
    indexDb: process.env.INDEX_DB_PATH,
    results: process.env.RESULTS_PATH,
  },
  split: {
    trainRatio: parseFloat(process.env.TRAIN_RATIO || '0.8'),
    randomSeed: parseInt(process.env.RANDOM_SEED || '42', 10),
  },
};