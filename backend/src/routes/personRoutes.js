import { Router } from 'express'
import * as personController from '../controllers/personController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/rolesMiddleware.js'

const router = Router()

// GET /api/persons — all authenticated users
router.get('/', authenticate, personController.getAll)

// GET /api/persons/:id — all authenticated users
router.get('/:id', authenticate, personController.getById)

// POST /api/persons — admin only
router.post('/', authenticate, requireAdmin, personController.create)

// PATCH /api/persons/:id — admin only
router.patch('/:id', authenticate, requireAdmin, personController.update)

// DELETE /api/persons/:id — admin only
router.delete('/:id', authenticate, requireAdmin, personController.remove)

export default router
