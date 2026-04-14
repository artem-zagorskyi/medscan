import { Router } from 'express'
import * as recordController from '../controllers/recordController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/rolesMiddleware.js'

const router = Router()

// GET /api/records — all authenticated users
router.get('/', authenticate, recordController.getAll)

// GET /api/records/entry-type/:entryType — all authenticated users
router.get('/entry-type/:entryType', authenticate, recordController.getByEntryType)

// GET /api/records/medical-record/:medicalRecordId — all authenticated users
router.get('/medical-record/:medicalRecordId', authenticate, recordController.getByMedicalRecord)

// GET /api/records/doctor/:doctorId — all authenticated users
router.get('/doctor/:doctorId', authenticate, recordController.getByDoctor)

// GET /api/records/:id — all authenticated users
router.get('/:id', authenticate, recordController.getById)

// POST /api/records — doctors and admins
router.post('/', authenticate, requireRole('DOCTOR', 'ADMIN'), recordController.create)

// PATCH /api/records/:id — doctors and admins
router.patch('/:id', authenticate, requireRole('DOCTOR', 'ADMIN'), recordController.update)

// PATCH /api/records/:id/attach-research — doctors and admins
router.patch('/:id/attach-research', authenticate, requireRole('DOCTOR', 'ADMIN'), recordController.attachResearch)

// DELETE /api/records/:id — doctors and admins
router.delete('/:id', authenticate, requireRole('DOCTOR', 'ADMIN'), recordController.remove)

export default router
