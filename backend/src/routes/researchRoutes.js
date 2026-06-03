import { Router } from 'express'
import * as researchController from '../controllers/researchController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/rolesMiddleware.js'

const router = Router()

router.use(authenticate)

// GET /api/researches — всі дослідження
router.get('/', researchController.getAll)

// GET /api/researches/unclassified — дослідження без кейсу
router.get('/unclassified', researchController.getUnclassified)

// GET /api/researches/status/:status — фільтр по статусу
router.get('/status/:status', researchController.getByStatus)

// GET /api/researches/:id — дослідження по id
router.get('/:id', researchController.getById)

// GET /api/researches/medical-record/:medicalRecordId — дослідження пацієнта
router.get('/medical-record/:medicalRecordId', researchController.getByMedicalRecord)

// GET /api/researches/case/:caseId — дослідження кейсу
router.get('/case/:caseId', researchController.getByCase)

// POST /api/researches — створити дослідження
router.post('/', requireRole('DOCTOR', 'ADMIN'), researchController.create)

// PATCH /api/researches/:id — оновити результати
router.patch('/:id', requireRole('DOCTOR', 'ADMIN'), researchController.update)

// PATCH /api/researches/:id/status — оновити статус
router.patch('/:id/status', requireRole('DOCTOR', 'ADMIN'), researchController.updateStatus)

// PATCH /api/researches/:id/assign-case — прив'язати до кейсу
router.patch('/:id/assign-case', requireRole('DOCTOR', 'ADMIN'), researchController.assignToCase)

// DELETE /api/researches/:id — видалити дослідження
router.delete('/:id', requireRole('DOCTOR', 'ADMIN'), researchController.remove)

export default router