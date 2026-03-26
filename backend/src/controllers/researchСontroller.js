import * as researchService from '../services/research.service.js'

// GET /api/researches
export const getAll = async (req, res) => {
  try {
    const data = await researchService.getAll()
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/researches/:id
export const getById = async (req, res) => {
  try {
    const data = await researchService.getById(Number(req.params.id))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/researches/medical-record/:medicalRecordId
export const getByMedicalRecord = async (req, res) => {
  try {
    const data = await researchService.getByMedicalRecord(Number(req.params.medicalRecordId))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/researches/status/:status
export const getByStatus = async (req, res) => {
  try {
    const data = await researchService.getByStatus(req.params.status)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// POST /api/researches
export const create = async (req, res) => {
  try {
    const data = await researchService.create(req.body)
    res.status(201).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/researches/:id
export const update = async (req, res) => {
  try {
    const data = await researchService.update(Number(req.params.id), req.body)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/researches/:id/status
export const updateStatus = async (req, res) => {
  try {
    const data = await researchService.updateStatus(Number(req.params.id), req.body.status)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// DELETE /api/researches/:id
export const remove = async (req, res) => {
  try {
    await researchService.remove(Number(req.params.id))
    res.status(200).json({ message: 'Research deleted successfully' })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}
