import { Router } from 'express'
import * as patientDiseaseController from '../controllers/patientDiseaseController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/rolesMiddleware.js'

const router = Router()

// GET /api/patient-diseases/medical-record/:medicalRecordId — all authenticated users
router.get('/medical-record/:medicalRecordId', authenticate, patientDiseaseController.getByMedicalRecord)

// GET /api/patient-diseases/medical-record/:medicalRecordId/status/:status — all authenticated users
router.get('/medical-record/:medicalRecordId/status/:status', authenticate, patientDiseaseController.getByStatus)

// POST /api/patient-diseases — doctors and admins
router.post('/', authenticate, requireRole('DOCTOR', 'ADMIN'), patientDiseaseController.add)

// PATCH /api/patient-diseases/medical-record/:medicalRecordId/disease/:diseaseId/status — doctors and admins
router.patch('/medical-record/:medicalRecordId/disease/:diseaseId/status', authenticate, requireRole('DOCTOR', 'ADMIN'), patientDiseaseController.updateStatus)

// DELETE /api/patient-diseases/medical-record/:medicalRecordId/disease/:diseaseId — doctors and admins
router.delete('/medical-record/:medicalRecordId/disease/:diseaseId', authenticate, requireRole('DOCTOR', 'ADMIN'), patientDiseaseController.remove)

export default router
