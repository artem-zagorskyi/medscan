import { Router } from 'express'
import * as caseController from '../controllers/caseController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/rolesMiddleware.js'

const router = Router()

router.use(authenticate)

// GET /api/cases — всі кейси
router.get('/', caseController.getAll)

// GET /api/cases/:id — кейс по id (з записами та дослідженнями)
router.get('/:id', caseController.getById)

// GET /api/cases/medical-record/:medicalRecordId — кейси пацієнта
router.get('/medical-record/:medicalRecordId', caseController.getByMedicalRecord)

// POST /api/cases — створити кейс (лікар або адмін)
router.post('/', requireRole('DOCTOR', 'ADMIN'), caseController.create)

// PATCH /api/cases/:id — оновити кейс (статус, опис, дата закриття)
router.patch('/:id', requireRole('DOCTOR', 'ADMIN'), caseController.update)

// DELETE /api/cases/:id — видалити кейс
router.delete('/:id', requireRole('DOCTOR', 'ADMIN'), caseController.remove)

export default router