import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

// Routes
import authRoutes from './routes/authRoutes.js'
import personRoutes from './routes/personRoutes.js'
import accountRoutes from './routes/accountRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import patientRoutes from './routes/patientRoutes.js'
import doctorPatientRoutes from './routes/doctorPatientRoutes.js'
import medicalRecordRoutes from './routes/medicalRecordRoutes.js'
import recordRoutes from './routes/recordRoutes.js'
import researchRoutes from './routes/researchRoutes.js'
import researchFileRoutes from './routes/researchFileRoutes.js'
import diseaseRoutes from './routes/diseaseRoutes.js'
import patientDiseaseRoutes from './routes/patientDiseaseRoutes.js'
import allergenRoutes from './routes/allergenRoutes.js'
import patientAllergyRoutes from './routes/patientAllergyRoutes.js'
import caseRoutes from './routes/caseRoutes.js'
import recordDoctorRoutes from './routes/recordDoctorRoutes.js'
import recordDiagnosisRoutes from './routes/recordDiagnosisRoutes.js'
import recordMedicationRoutes from './routes/recordMedicationRoutes.js'
import recordResearchRoutes from './routes/recordResearchRoutes.js'
import recordAllergyRoutes from './routes/recordAllergyRoutes.js'
import medicationRoutes from './routes/medicationRoutes.js'
import mlRoutes from './routes/mlRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'

const app = express()

// ─────────────────────────────────────────
// GLOBAL MIDDLEWARE
// ─────────────────────────────────────────

// Allow requests from WPF desktop client
app.use(cors())

// Parse incoming JSON request bodies
app.use(express.json())

// Log HTTP requests in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

app.use('/api/auth', authRoutes)
app.use('/api/persons', personRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/doctor-patient', doctorPatientRoutes)
app.use('/api/medical-records', medicalRecordRoutes)
app.use('/api/records', recordRoutes)
app.use('/api/researches', researchRoutes)
app.use('/api/research-files', researchFileRoutes)
app.use('/api/diseases', diseaseRoutes)
app.use('/api/patient-diseases', patientDiseaseRoutes)
app.use('/api/allergens', allergenRoutes)
app.use('/api/patient-allergies', patientAllergyRoutes)
app.use('/api/cases', caseRoutes)
app.use('/api/record-doctors', recordDoctorRoutes)
app.use('/api/record-diagnoses', recordDiagnosisRoutes)
app.use('/api/record-medications', recordMedicationRoutes)
app.use('/api/record-researches', recordResearchRoutes)
app.use('/api/record-allergies', recordAllergyRoutes)
app.use('/api/medications', medicationRoutes)
app.use('/api/ml', mlRoutes)
app.use('/api/settings', settingsRoutes)

// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─────────────────────────────────────────
// 404 HANDLER — unknown routes
// ─────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` })
})

// ─────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error'
  })
})

export default app