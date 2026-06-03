import { Router } from 'express'
import * as diseaseController from '../controllers/diseaseController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/rolesMiddleware.js'

const router = Router()

// GET /api/diseases — all authenticated users
router.get('/', authenticate, diseaseController.getAll)

// GET /api/diseases/search?q=query — all authenticated users
router.get('/search', authenticate, diseaseController.search)

// GET /api/diseases/icd/:icdCode — all authenticated users
router.get('/icd/:icdCode', authenticate, diseaseController.getByIcdCode)

// GET /api/diseases/:id — all authenticated users
router.get('/:id', authenticate, diseaseController.getById)

// POST /api/diseases — admin only
router.post('/', authenticate, requireAdmin, diseaseController.create)

// PATCH /api/diseases/:id — admin only
router.patch('/:id', authenticate, requireAdmin, diseaseController.update)

// DELETE /api/diseases/:id — admin only
router.delete('/:id', authenticate, requireAdmin, diseaseController.remove)

export default router
