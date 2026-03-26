import * as accountService from '../services/account.service.js'

// GET /api/accounts/person/:personId
export const getByPersonId = async (req, res) => {
  try {
    const data = await accountService.getByPersonId(Number(req.params.personId))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/accounts/email/:email
export const getByEmail = async (req, res) => {
  try {
    const data = await accountService.getByEmail(req.params.email)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// POST /api/accounts
export const create = async (req, res) => {
  try {
    const data = await accountService.create(req.body)
    res.status(201).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/accounts/person/:personId/password
export const updatePassword = async (req, res) => {
  try {
    await accountService.updatePassword(Number(req.params.personId), req.body)
    res.status(200).json({ message: 'Password updated successfully' })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/accounts/person/:personId/rights
export const updateRights = async (req, res) => {
  try {
    const data = await accountService.updateRights(Number(req.params.personId), req.body.rights)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// DELETE /api/accounts/person/:personId
export const remove = async (req, res) => {
  try {
    await accountService.remove(Number(req.params.personId))
    res.status(200).json({ message: 'Account deleted successfully' })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}
