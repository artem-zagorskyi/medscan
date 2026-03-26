import * as diseaseService from '../services/disease.service.js'

// GET /api/diseases
export const getAll = async (req, res) => {
  try {
    const data = await diseaseService.getAll()
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/diseases/:id
export const getById = async (req, res) => {
  try {
    const data = await diseaseService.getById(Number(req.params.id))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/diseases/icd/:icdCode
export const getByIcdCode = async (req, res) => {
  try {
    const data = await diseaseService.getByIcdCode(req.params.icdCode)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/diseases/search?q=query
export const search = async (req, res) => {
  try {
    const data = await diseaseService.search(req.query.q || '')
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// POST /api/diseases
export const create = async (req, res) => {
  try {
    const data = await diseaseService.create(req.body)
    res.status(201).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/diseases/:id
export const update = async (req, res) => {
  try {
    const data = await diseaseService.update(Number(req.params.id), req.body)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// DELETE /api/diseases/:id
export const remove = async (req, res) => {
  try {
    await diseaseService.remove(Number(req.params.id))
    res.status(200).json({ message: 'Disease deleted successfully' })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}
