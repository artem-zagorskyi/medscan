import { Router } from 'express'
import * as patientController from '../controllers/patientController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/rolesMiddleware.js'

const router = Router()

// GET /api/patients — all authenticated users
router.get('/', authenticate, patientController.getAll)

// GET /api/patients/doctor/:doctorId — all authenticated users
router.get('/doctor/:doctorId', authenticate, patientController.getByDoctorId)

// GET /api/patients/:id — all authenticated users
router.get('/:id', authenticate, patientController.getById)

// POST /api/patients — admin only
router.post('/', authenticate, requireAdmin, patientController.create)

// PATCH /api/patients/:id — admin only
router.patch('/:id', authenticate, requireAdmin, patientController.update)

// DELETE /api/patients/:id — admin only
router.delete('/:id', authenticate, requireAdmin, patientController.remove)

export default router
