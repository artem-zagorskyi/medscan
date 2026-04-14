import { Router } from 'express'
import * as patientAllergyController from '../controllers/patientAllergyController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/rolesMiddleware.js'

const router = Router()

// GET /api/patient-allergies/medical-record/:medicalRecordId — all authenticated users
router.get('/medical-record/:medicalRecordId', authenticate, patientAllergyController.getByMedicalRecord)

// GET /api/patient-allergies/medical-record/:medicalRecordId/severity/:severity — all authenticated users
router.get('/medical-record/:medicalRecordId/severity/:severity', authenticate, patientAllergyController.getBySeverity)

// POST /api/patient-allergies — doctors and admins
router.post('/', authenticate, requireRole('DOCTOR', 'ADMIN'), patientAllergyController.add)

// PATCH /api/patient-allergies/medical-record/:medicalRecordId/allergen/:allergenId/severity — doctors and admins
router.patch('/medical-record/:medicalRecordId/allergen/:allergenId/severity', authenticate, requireRole('DOCTOR', 'ADMIN'), patientAllergyController.updateSeverity)

// DELETE /api/patient-allergies/medical-record/:medicalRecordId/allergen/:allergenId — doctors and admins
router.delete('/medical-record/:medicalRecordId/allergen/:allergenId', authenticate, requireRole('DOCTOR', 'ADMIN'), patientAllergyController.remove)

export default router
