import * as recordService from '../services/record.service.js'

// GET /api/records
export const getAll = async (req, res) => {
  try {
    const data = await recordService.getAll()
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/records/:id
export const getById = async (req, res) => {
  try {
    const data = await recordService.getById(Number(req.params.id))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/records/medical-record/:medicalRecordId
export const getByMedicalRecord = async (req, res) => {
  try {
    const data = await recordService.getByMedicalRecord(Number(req.params.medicalRecordId))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/records/doctor/:doctorId
export const getByDoctor = async (req, res) => {
  try {
    const data = await recordService.getByDoctor(Number(req.params.doctorId))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/records/entry-type/:entryType
export const getByEntryType = async (req, res) => {
  try {
    const data = await recordService.getByEntryType(req.params.entryType)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// POST /api/records
export const create = async (req, res) => {
  try {
    const data = await recordService.create(req.body)
    res.status(201).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/records/:id
export const update = async (req, res) => {
  try {
    const data = await recordService.update(Number(req.params.id), req.body)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// DELETE /api/records/:id
export const remove = async (req, res) => {
  try {
    await recordService.remove(Number(req.params.id))
    res.status(200).json({ message: 'Record deleted successfully' })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/records/:id/attach-research
export const attachResearch = async (req, res) => {
  try {
    const data = await recordService.attachResearch(Number(req.params.id), req.body.research_id)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}
