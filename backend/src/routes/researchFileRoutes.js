import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import * as researchFileController from '../controllers/researchFileController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/rolesMiddleware.js'

// Multer storage config — save PDF files to uploads/researches/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/researches/')
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + original name
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  }
})

// Only allow PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Only PDF files are allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    // Max file size: 20MB
    fileSize: 20 * 1024 * 1024
  }
})

const router = Router()

// GET /api/research-files — all authenticated users
router.get('/', authenticate, researchFileController.getAll)

// GET /api/research-files/unclassified — doctors and admins
router.get('/unclassified', authenticate, requireRole('DOCTOR', 'ADMIN'), researchFileController.getUnclassified)

// GET /api/research-files/status/:status — all authenticated users
router.get('/status/:status', authenticate, researchFileController.getByStatus)

// GET /api/research-files/medical-record/:medicalRecordId — all authenticated users
router.get('/medical-record/:medicalRecordId', authenticate, researchFileController.getByMedicalRecord)

// GET /api/research-files/:id — all authenticated users
router.get('/:id', authenticate, researchFileController.getById)

// POST /api/research-files/upload — doctors and admins + multer middleware
router.post('/upload', authenticate, requireRole('DOCTOR', 'ADMIN'), upload.single('file'), researchFileController.upload)

// PATCH /api/research-files/:id/classify — doctors and admins
router.patch('/:id/classify', authenticate, requireRole('DOCTOR', 'ADMIN'), researchFileController.classify)

// PATCH /api/research-files/:id/status — doctors and admins
router.patch('/:id/status', authenticate, requireRole('DOCTOR', 'ADMIN'), researchFileController.updateStatus)

// DELETE /api/research-files/:id — doctors and admins
router.delete('/:id', authenticate, requireRole('DOCTOR', 'ADMIN'), researchFileController.remove)

router.get('/research-files/:id/download', authenticate, requireRole('DOCTOR', 'ADMIN'), researchFileController.downloadResearchFile)

export default router
