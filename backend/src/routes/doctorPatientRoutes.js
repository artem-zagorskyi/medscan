import { Router } from 'express'
import * as doctorPatientController from '../controllers/doctorPatientController.js'
import { authenticate } from '../middleware/authMiddleware.js'

const router = Router()

// GET /api/doctor-patient/patient/:patientId/doctors — all authenticated users
router.get('/patient/:patientId/doctors', authenticate, doctorPatientController.getDoctorsByPatient)

// GET /api/doctor-patient/doctor/:doctorId/patients — all authenticated users
router.get('/doctor/:doctorId/patients', authenticate, doctorPatientController.getPatientsByDoctor)

export default router
