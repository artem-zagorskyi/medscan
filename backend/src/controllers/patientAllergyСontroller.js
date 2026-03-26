import * as patientAllergyService from '../services/patientAllergy.service.js'

// GET /api/patient-allergies/medical-record/:medicalRecordId
export const getByMedicalRecord = async (req, res) => {
  try {
    const data = await patientAllergyService.getByMedicalRecord(Number(req.params.medicalRecordId))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/patient-allergies/medical-record/:medicalRecordId/severity/:severity
export const getBySeverity = async (req, res) => {
  try {
    const data = await patientAllergyService.getBySeverity(
      Number(req.params.medicalRecordId),
      req.params.severity
    )
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// POST /api/patient-allergies
export const add = async (req, res) => {
  try {
    const data = await patientAllergyService.add(req.body)
    res.status(201).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/patient-allergies/medical-record/:medicalRecordId/allergen/:allergenId/severity
export const updateSeverity = async (req, res) => {
  try {
    const data = await patientAllergyService.updateSeverity(
      Number(req.params.medicalRecordId),
      Number(req.params.allergenId),
      req.body
    )
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// DELETE /api/patient-allergies/medical-record/:medicalRecordId/allergen/:allergenId
export const remove = async (req, res) => {
  try {
    await patientAllergyService.remove(
      Number(req.params.medicalRecordId),
      Number(req.params.allergenId)
    )
    res.status(200).json({ message: 'Allergy removed from patient successfully' })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}
