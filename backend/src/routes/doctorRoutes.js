import { Router } from 'express'
import * as doctorController from '../controllers/doctorController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/rolesMiddleware.js'

const router = Router()

// GET /api/doctors/person/:personId — all authenticated users
router.get('/person/:personId', authenticate, doctorController.getByPersonId)

// GET /api/doctors — all authenticated users
router.get('/', authenticate, doctorController.getAll)

// GET /api/doctors/specialization/:specialization — all authenticated users
router.get('/specialization/:specialization', authenticate, doctorController.getBySpecialization)

// GET /api/doctors/:id — all authenticated users
router.get('/:id', authenticate, doctorController.getById)

// GET /api/doctors/:id/patients — all authenticated users
router.get('/:id/patients', authenticate, doctorController.getPatients)

// POST /api/doctors — admin only
router.post('/', authenticate, requireAdmin, doctorController.create)

// PATCH /api/doctors/:id — admin only
router.patch('/:id', authenticate, requireAdmin, doctorController.update)

// DELETE /api/doctors/:id — admin only
router.delete('/:id', authenticate, requireAdmin, doctorController.remove)

export default router
