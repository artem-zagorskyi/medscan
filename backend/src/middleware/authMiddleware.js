import * as authService from '../services/authService.js'

// Verify JWT token from Authorization header
// Adds decoded user data to req.user for use in controllers
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    // Check if Authorization header exists and has correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is missing or malformed' })
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1]

    // Verify token and decode payload
    const decoded = authService.verifyToken(token)

    // Attach decoded user info to request for use in controllers
    req.user = decoded

    next()
  } catch (error) {
    return res.status(error.statusCode || 401).json({ message: error.message })
  }
}
