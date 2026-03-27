import * as patientService from '../services/patientService.js'

// GET /api/patients
export const getAll = async (req, res) => {
  try {
    const data = await patientService.getAll()
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/patients/:id
export const getById = async (req, res) => {
  try {
    const data = await patientService.getById(Number(req.params.id))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/patients/doctor/:doctorId
export const getByDoctorId = async (req, res) => {
  try {
    const data = await patientService.getByDoctorId(Number(req.params.doctorId))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// POST /api/patients
export const create = async (req, res) => {
  try {
    const data = await patientService.create(req.body)
    res.status(201).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/patients/:id
export const update = async (req, res) => {
  try {
    const data = await patientService.update(Number(req.params.id), req.body)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// DELETE /api/patients/:id
export const remove = async (req, res) => {
  try {
    await patientService.remove(Number(req.params.id))
    res.status(200).json({ message: 'Patient deleted successfully' })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}
