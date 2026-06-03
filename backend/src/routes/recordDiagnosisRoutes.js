import { Router } from 'express'
import * as recordDiagnosisController from '../controllers/recordDiagnosisController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/rolesMiddleware.js'

const router = Router()

router.use(authenticate)

// GET /api/record-diagnoses/record/:recordId — діагнози запису
router.get('/record/:recordId', recordDiagnosisController.getByRecord)

// POST /api/record-diagnoses — додати діагноз до запису (синхронізується з PatientDiseases)
router.post('/', requireRole('DOCTOR', 'ADMIN'), recordDiagnosisController.add)

// PATCH /api/record-diagnoses/:id — оновити діагноз запису
router.patch('/:id', requireRole('DOCTOR', 'ADMIN'), recordDiagnosisController.update)

// DELETE /api/record-diagnoses/:id — видалити діагноз з запису
router.delete('/:id', requireRole('DOCTOR', 'ADMIN'), recordDiagnosisController.remove)

export default router