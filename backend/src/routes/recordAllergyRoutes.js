import { Router } from 'express'
import * as recordAllergyController from '../controllers/recordAllergyController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/rolesMiddleware.js'

const router = Router()

router.use(authenticate)

// GET /api/record-allergies/record/:recordId — алергії виявлені на прийомі
router.get('/record/:recordId', recordAllergyController.getByRecord)

// POST /api/record-allergies — додати алергію до запису (синхронізується з PatientAllergies)
router.post('/', requireRole('DOCTOR', 'ADMIN'), recordAllergyController.add)

// PATCH /api/record-allergies/:id — оновити важкість реакції
router.patch('/:id', requireRole('DOCTOR', 'ADMIN'), recordAllergyController.update)

// DELETE /api/record-allergies/:id — видалити алергію з запису
router.delete('/:id', requireRole('DOCTOR', 'ADMIN'), recordAllergyController.remove)

export default router