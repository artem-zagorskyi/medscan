import { Router } from 'express'
import * as recordResearchController from '../controllers/recordResearchController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/rolesMiddleware.js'

const router = Router()

router.use(authenticate)

// GET /api/record-researches/record/:recordId — дослідження прив'язані до запису
router.get('/record/:recordId', recordResearchController.getByRecord)

// POST /api/record-researches — прив'язати дослідження до запису
router.post('/', requireRole('DOCTOR', 'ADMIN'), recordResearchController.add)

// DELETE /api/record-researches/:id — відв'язати дослідження від запису
router.delete('/:id', requireRole('DOCTOR', 'ADMIN'), recordResearchController.remove)

export default router