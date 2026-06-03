import * as mlService from '../services/mlService.js'
import prisma from '../config/prisma.js'

// POST /api/ml/classify/:fileId
// Класифікує файл і повертає результат — нічого не зберігає
export const classifyFile = async (req, res, next) => {
  try {
    const fileId = Number(req.params.fileId)
    if (isNaN(fileId)) {
      return res.status(400).json({ message: 'Invalid file ID' })
    }

    // Отримуємо шлях до файлу з БД
    const file = await prisma.researchFile.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return res.status(404).json({ message: 'File not found' })
    }

    if (file.research_id) {
      return res.status(400).json({ message: 'File is already classified' })
    }

    // Тільки аналізуємо — не зберігаємо
    const result = await mlService.analyzeFile(file.file_path)

    res.status(200).json({
      fileId,
      filePath: file.file_path,
      ...result
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/ml/status
export const getStatus = async (req, res, next) => {
  try {
    const status = await mlService.checkOllamaStatus()
    res.status(200).json(status)
  } catch (err) {
    next(err)
  }
}