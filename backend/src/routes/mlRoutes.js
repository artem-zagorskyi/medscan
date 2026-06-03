import { Router } from 'express'
import * as mlController from '../controllers/mlController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/rolesMiddleware.js'

const router = Router()

// GET /api/ml/status — перевірити чи Ollama онлайн
router.get('/status', authenticate, mlController.getStatus)

// POST /api/ml/classify/:fileId — класифікувати PDF файл
router.post('/classify/:fileId', authenticate, requireRole('DOCTOR', 'ADMIN'), mlController.classifyFile)

export default router