import * as patientDiseaseService from '../services/patientDiseaseService.js'

// GET /api/patient-diseases/medical-record/:medicalRecordId
export const getByMedicalRecord = async (req, res) => {
  try {
    const data = await patientDiseaseService.getByMedicalRecord(Number(req.params.medicalRecordId))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/patient-diseases/medical-record/:medicalRecordId/status/:status
export const getByStatus = async (req, res) => {
  try {
    const data = await patientDiseaseService.getByStatus(
      Number(req.params.medicalRecordId),
      req.params.status
    )
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// POST /api/patient-diseases
export const add = async (req, res) => {
  try {
    const data = await patientDiseaseService.add(req.body)
    res.status(201).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/patient-diseases/medical-record/:medicalRecordId/disease/:diseaseId/status
export const updateStatus = async (req, res) => {
  try {
    const data = await patientDiseaseService.updateStatus(
      Number(req.params.medicalRecordId),
      Number(req.params.diseaseId),
      req.body.status
    )
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// DELETE /api/patient-diseases/medical-record/:medicalRecordId/disease/:diseaseId
export const remove = async (req, res) => {
  try {
    await patientDiseaseService.remove(
      Number(req.params.medicalRecordId),
      Number(req.params.diseaseId)
    )
    res.status(200).json({ message: 'Disease removed from patient successfully' })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}
