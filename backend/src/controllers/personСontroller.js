import * as personService from '../services/person.service.js'

// GET /api/persons
export const getAll = async (req, res) => {
  try {
    const data = await personService.getAll()
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/persons/:id
export const getById = async (req, res) => {
  try {
    const data = await personService.getById(Number(req.params.id))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// POST /api/persons
export const create = async (req, res) => {
  try {
    const data = await personService.create(req.body)
    res.status(201).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/persons/:id
export const update = async (req, res) => {
  try {
    const data = await personService.update(Number(req.params.id), req.body)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// DELETE /api/persons/:id
export const remove = async (req, res) => {
  try {
    await personService.remove(Number(req.params.id))
    res.status(200).json({ message: 'Person deleted successfully' })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}
