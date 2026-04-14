import { Router } from 'express'
import * as researchController from '../controllers/researchController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/rolesMiddleware.js'

const router = Router()

// GET /api/researches — all authenticated users
router.get('/', authenticate, researchController.getAll)

// GET /api/researches/status/:status — all authenticated users
router.get('/status/:status', authenticate, researchController.getByStatus)

// GET /api/researches/medical-record/:medicalRecordId — all authenticated users
router.get('/medical-record/:medicalRecordId', authenticate, researchController.getByMedicalRecord)

// GET /api/researches/:id — all authenticated users
router.get('/:id', authenticate, researchController.getById)

// POST /api/researches — doctors and admins
router.post('/', authenticate, requireRole('DOCTOR', 'ADMIN'), researchController.create)

// PATCH /api/researches/:id — doctors and admins
router.patch('/:id', authenticate, requireRole('DOCTOR', 'ADMIN'), researchController.update)

// PATCH /api/researches/:id/status — doctors and admins
router.patch('/:id/status', authenticate, requireRole('DOCTOR', 'ADMIN'), researchController.updateStatus)

// DELETE /api/researches/:id — doctors and admins
router.delete('/:id', authenticate, requireRole('DOCTOR', 'ADMIN'), researchController.remove)

export default router
