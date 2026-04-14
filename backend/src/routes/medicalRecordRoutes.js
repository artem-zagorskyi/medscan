import { Router } from 'express'
import * as medicalRecordController from '../controllers/medicalRecordController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireAdmin, requireRole } from '../middleware/rolesMiddleware.js'

const router = Router()

// GET /api/medical-records/:id — all authenticated users
router.get('/:id', authenticate, medicalRecordController.getById)

// GET /api/medical-records/patient/:patientId — all authenticated users
router.get('/patient/:patientId', authenticate, medicalRecordController.getByPatientId)

// GET /api/medical-records/:id/full — all authenticated users
router.get('/:id/full', authenticate, medicalRecordController.getFullRecord)

// POST /api/medical-records — admin only
router.post('/', authenticate, requireAdmin, medicalRecordController.create)

// PATCH /api/medical-records/:id/blood-info — doctors and admins
router.patch('/:id/blood-info', authenticate, requireRole('DOCTOR', 'ADMIN'), medicalRecordController.updateBloodInfo)

export default router
