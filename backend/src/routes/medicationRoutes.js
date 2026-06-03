import { Router } from 'express'
import * as medicationController from '../controllers/medicationController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/rolesMiddleware.js'

const router = Router()

router.use(authenticate)

// GET /api/medications — всі медикаменти (алфавітно)
router.get('/', medicationController.getAll)

// GET /api/medications/search?q= — пошук по назві або активній речовині
router.get('/search', medicationController.search)

// GET /api/medications/:id — медикамент по id
router.get('/:id', medicationController.getById)

// POST /api/medications — додати медикамент (тільки адмін)
router.post('/', requireAdmin, medicationController.create)

// PATCH /api/medications/:id — оновити медикамент (тільки адмін)
router.patch('/:id', requireAdmin, medicationController.update)

// DELETE /api/medications/:id — видалити медикамент (тільки адмін)
router.delete('/:id', requireAdmin, medicationController.remove)

export default router