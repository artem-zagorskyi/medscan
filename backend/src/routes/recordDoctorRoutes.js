import { Router } from 'express'
import * as recordDoctorController from '../controllers/recordDoctorController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/rolesMiddleware.js'

const router = Router()

router.use(authenticate)

// GET /api/record-doctors/record/:recordId — лікарі консиліуму запису
router.get('/record/:recordId', recordDoctorController.getByRecord)

// POST /api/record-doctors — додати лікаря до консиліуму
router.post('/', requireRole('DOCTOR', 'ADMIN'), recordDoctorController.add)

// PATCH /api/record-doctors/:id — оновити роль лікаря
router.patch('/:id', requireRole('DOCTOR', 'ADMIN'), recordDoctorController.update)

// DELETE /api/record-doctors/:id — видалити лікаря з консиліуму
router.delete('/:id', requireRole('DOCTOR', 'ADMIN'), recordDoctorController.remove)

export default router