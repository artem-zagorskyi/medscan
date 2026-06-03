import { Router } from 'express'
import * as recordController from '../controllers/recordController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/rolesMiddleware.js'

const router = Router()

router.use(authenticate)

// GET /api/records — всі записи
router.get('/', recordController.getAll)

// GET /api/records/:id — запис по id з усіма деталями
router.get('/:id', recordController.getById)

// GET /api/records/medical-record/:medicalRecordId — записи пацієнта
router.get('/medical-record/:medicalRecordId', recordController.getByMedicalRecord)

// GET /api/records/case/:caseId — записи кейсу
router.get('/case/:caseId', recordController.getByCase)

// GET /api/records/doctor/:doctorId — записи лікаря
router.get('/doctor/:doctorId', recordController.getByDoctor)

// POST /api/records — створити запис
router.post('/', requireRole('DOCTOR', 'ADMIN'), recordController.create)

// PATCH /api/records/:id — оновити запис (тільки DRAFT)
router.patch('/:id', requireRole('DOCTOR', 'ADMIN'), recordController.update)

// PATCH /api/records/:id/sign — підписати запис
router.patch('/:id/sign', requireRole('DOCTOR', 'ADMIN'), recordController.sign)

// DELETE /api/records/:id — видалити запис (тільки DRAFT)
router.delete('/:id', requireRole('DOCTOR', 'ADMIN'), recordController.remove)

export default router