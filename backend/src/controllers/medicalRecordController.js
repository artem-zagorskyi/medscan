import * as medicalRecordService from '../services/medicalRecordService.js'

export const updatePhysicalInfo = async (req, res, next) => {
  try {
    const updated = await medicalRecordService.updatePhysicalInfo(Number(req.params.id), req.body)
    res.json(updated)
  } catch (err) { next(err) }
}

// GET /api/medical-records/:id
export const getById = async (req, res) => {
  try {
    const data = await medicalRecordService.getById(Number(req.params.id))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/medical-records/patient/:patientId
export const getByPatientId = async (req, res) => {
  try {
    const data = await medicalRecordService.getByPatientId(Number(req.params.patientId))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/medical-records/:id/full
export const getFullRecord = async (req, res) => {
  try {
    const data = await medicalRecordService.getFullRecord(Number(req.params.id))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// POST /api/medical-records
export const create = async (req, res) => {
  try {
    const data = await medicalRecordService.create(req.body)
    res.status(201).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/medical-records/:id/blood-info
export const updateBloodInfo = async (req, res) => {
  try {
    const data = await medicalRecordService.updateBloodInfo(Number(req.params.id), req.body)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}
