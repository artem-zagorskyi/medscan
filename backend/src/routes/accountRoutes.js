import { Router } from 'express'
import * as accountController from '../controllers/accountController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/rolesMiddleware.js'

const router = Router()

// GET /api/accounts/person/:personId — admin only
router.get('/person/:personId', authenticate, requireAdmin, accountController.getByPersonId)

// GET /api/accounts/email/:email — admin only
router.get('/email/:email', authenticate, requireAdmin, accountController.getByEmail)

// POST /api/accounts — admin only
router.post('/', authenticate, requireAdmin, accountController.create)

// PATCH /api/accounts/person/:personId/password — own account only (checked in controller)
router.patch('/person/:personId/password', authenticate, accountController.updatePassword)

// PATCH /api/accounts/person/:personId/rights — admin only
router.patch('/person/:personId/rights', authenticate, requireAdmin, accountController.updateRights)

// DELETE /api/accounts/person/:personId — admin only
router.delete('/person/:personId', authenticate, requireAdmin, accountController.remove)

// PATCH /api/accounts/person/:personId/deactivate — admin only
router.patch('/person/:personId/deactivate', authenticate, requireAdmin, accountController.deactivate)

// PATCH /api/accounts/person/:personId/activate — admin only
router.patch('/person/:personId/activate', authenticate, requireAdmin, accountController.activate)

export default router
