import { Router } from 'express'
import * as recordMedicationController from '../controllers/recordMedicationController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/rolesMiddleware.js'

const router = Router()

router.use(authenticate)

// GET /api/record-medications/record/:recordId — медикаменти запису
router.get('/record/:recordId', recordMedicationController.getByRecord)

// POST /api/record-medications — додати медикамент до запису
router.post('/', requireRole('DOCTOR', 'ADMIN'), recordMedicationController.add)

// PATCH /api/record-medications/:id — оновити призначення
router.patch('/:id', requireRole('DOCTOR', 'ADMIN'), recordMedicationController.update)

// DELETE /api/record-medications/:id — видалити медикамент з запису
router.delete('/:id', requireRole('DOCTOR', 'ADMIN'), recordMedicationController.remove)

export default router