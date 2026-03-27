import * as allergenService from '../services/allergenService.js'

// GET /api/allergens
export const getAll = async (req, res) => {
  try {
    const data = await allergenService.getAll()
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/allergens/:id
export const getById = async (req, res) => {
  try {
    const data = await allergenService.getById(Number(req.params.id))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/allergens/category/:category
export const getByCategory = async (req, res) => {
  try {
    const data = await allergenService.getByCategory(req.params.category)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/allergens/search?q=query
export const search = async (req, res) => {
  try {
    const data = await allergenService.search(req.query.q || '')
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// POST /api/allergens
export const create = async (req, res) => {
  try {
    const data = await allergenService.create(req.body)
    res.status(201).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/allergens/:id
export const update = async (req, res) => {
  try {
    const data = await allergenService.update(Number(req.params.id), req.body)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// DELETE /api/allergens/:id
export const remove = async (req, res) => {
  try {
    await allergenService.remove(Number(req.params.id))
    res.status(200).json({ message: 'Allergen deleted successfully' })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}
