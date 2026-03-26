import * as doctorService from '../services/doctor.service.js'

// GET /api/doctors
export const getAll = async (req, res) => {
  try {
    const data = await doctorService.getAll()
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/doctors/:id
export const getById = async (req, res) => {
  try {
    const data = await doctorService.getById(Number(req.params.id))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/doctors/specialization/:specialization
export const getBySpecialization = async (req, res) => {
  try {
    const data = await doctorService.getBySpecialization(req.params.specialization)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/doctors/:id/patients
export const getPatients = async (req, res) => {
  try {
    const data = await doctorService.getPatients(Number(req.params.id))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// POST /api/doctors
export const create = async (req, res) => {
  try {
    const data = await doctorService.create(req.body)
    res.status(201).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/doctors/:id
export const update = async (req, res) => {
  try {
    const data = await doctorService.update(Number(req.params.id), req.body)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// DELETE /api/doctors/:id
export const remove = async (req, res) => {
  try {
    await doctorService.remove(Number(req.params.id))
    res.status(200).json({ message: 'Doctor deleted successfully' })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}
