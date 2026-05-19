/**
 * Нормализует вектор до единичной длины (L2 normalization).
 * После нормализации cosine similarity = простое скалярное произведение,
 * что в разы быстрее на больших массивах.
 */
export function normalize(vector) {
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vector.slice(); // защита от нулевого вектора

  const result = new Float32Array(vector.length);
  for (let i = 0; i < vector.length; i++) {
    result[i] = vector[i] / norm;
  }
  return result;
}

/**
 * Скалярное произведение двух нормализованных векторов.
 * Эквивалентно cosine similarity, если оба вектора уже нормализованы.
 */
export function dotProduct(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Преобразует Float32Array в Buffer для хранения в SQLite BLOB.
 * КРИТИЧНО: создаём НОВЫЙ буфер с копией данных, чтобы он был полностью
 * независим от исходного Float32Array. Иначе при переиспользовании памяти
 * движком JS в БД могут попасть неверные данные.
 */
export function vectorToBuffer(vector) {
  const buffer = Buffer.allocUnsafe(vector.byteLength);
  const view = new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
  for (let i = 0; i < view.length; i++) {
    buffer[i] = view[i];
  }
  return buffer;
}

/**
 * Преобразует Buffer обратно в Float32Array.
 * КРИТИЧНО: делаем полную копию данных в новый ArrayBuffer.
 * Иначе better-sqlite3 переиспользует один буфер при последовательных чтениях,
 * и все Float32Array будут указывать на одну и ту же память.
 */
export function bufferToVector(buffer) {
  const ab = new ArrayBuffer(buffer.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buffer.byteLength; i++) {
    view[i] = buffer[i];
  }
  return new Float32Array(ab);
}