// settings.controller.js
import { getOllamaHost, setOllamaHost } from '../services/mlService.js'

export function getGpuUrl(req, res) {
  res.json({ url: getOllamaHost() })
}

export function updateGpuUrl(req, res) {
  const { url } = req.body
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url обязателен' })
  }
  try {
    new URL(url)
  } catch {
    return res.status(400).json({ error: 'невалидный url' })
  }
  setOllamaHost(url.replace(/\/+$/, ''))
  res.json({ url: getOllamaHost() })
}