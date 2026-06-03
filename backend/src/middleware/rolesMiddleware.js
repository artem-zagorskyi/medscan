// Check if authenticated user has the required rights
// Usage: router.delete('/:id', authenticate, requireAdmin, controller.remove)

export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized — no user found in request' })
    }

    if (req.user.rights !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden — admin rights required' })
    }

    next()
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// Check if authenticated user has a specific role
// Usage: router.get('/', authenticate, requireRole('DOCTOR'), controller.getAll)
export const requireRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized — no user found in request' })
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: `Forbidden — required role: ${roles.join(' or ')}` })
      }

      next()
    } catch (error) {
      return res.status(500).json({ message: error.message })
    }
  }
}
