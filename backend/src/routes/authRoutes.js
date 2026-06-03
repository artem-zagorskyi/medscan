import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/rolesMiddleware.js'

const router = Router()

// POST /api/auth/register — admin only
router.post('/register', authenticate, requireAdmin, authController.register)

// POST /api/auth/login — public
router.post('/login', authController.login)

// GET /api/auth/me — requires auth
router.get('/me', authenticate, authController.me)

// PATCH /api/auth/change-password — requires auth
router.patch('/change-password', authenticate, authController.changePassword)

export default router
