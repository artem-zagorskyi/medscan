import 'dotenv/config'
import app from './src/app.js'
import prisma from './src/config/prisma.js'

const PORT = process.env.PORT || 3000

// Test database connection before starting the server
async function startServer() {
  try {
    await prisma.$connect()
    console.log('✅ Connected to MySQL database')

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📋 Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Graceful shutdown — close DB connection on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...')
  await prisma.$disconnect()
  console.log('✅ Database connection closed')
  process.exit(0)
})

startServer()