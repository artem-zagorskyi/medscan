// Custom error class that includes an HTTP status code
// Used across all services to throw structured errors
// Controllers read error.statusCode to return the correct HTTP response

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    // Maintain proper stack trace in Node.js
    Error.captureStackTrace(this, this.constructor)
  }
}