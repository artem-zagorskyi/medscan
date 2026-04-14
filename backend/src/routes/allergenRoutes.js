import { Router } from 'express'
import * as allergenController from '../controllers/allergenController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/rolesMiddleware.js'

const router = Router()

// GET /api/allergens — all authenticated users
router.get('/', authenticate, allergenController.getAll)

// GET /api/allergens/search?q=query — all authenticated users
router.get('/search', authenticate, allergenController.search)

// GET /api/allergens/category/:category — all authenticated users
router.get('/category/:category', authenticate, allergenController.getByCategory)

// GET /api/allergens/:id — all authenticated users
router.get('/:id', authenticate, allergenController.getById)

// POST /api/allergens — admin only
router.post('/', authenticate, requireAdmin, allergenController.create)

// PATCH /api/allergens/:id — admin only
router.patch('/:id', authenticate, requireAdmin, allergenController.update)

// DELETE /api/allergens/:id — admin only
router.delete('/:id', authenticate, requireAdmin, allergenController.remove)

export default router
