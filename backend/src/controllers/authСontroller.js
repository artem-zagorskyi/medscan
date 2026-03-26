import * as authService from '../services/auth.service.js'

// POST /api/auth/register
// Used by admin to register new doctors or staff
export const register = async (req, res) => {
  try {
    const data = await authService.register(req.body)
    res.status(201).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const data = await authService.login(email, password)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/auth/me
// Requires auth middleware — person_id is taken from JWT payload
export const me = async (req, res) => {
  try {
    const data = await authService.me(req.user.person_id)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/auth/change-password
// Requires auth middleware — person_id is taken from JWT payload
export const changePassword = async (req, res) => {
  try {
    await authService.changePassword(req.user.person_id, req.body)
    res.status(200).json({ message: 'Password changed successfully' })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}