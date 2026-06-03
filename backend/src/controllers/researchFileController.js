import * as researchFileService from '../services/researchFileService.js'
import path from 'path'
import fs from 'fs'
import prisma from '../config/prisma.js'

// GET /api/research-files
export const getAll = async (req, res) => {
  try {
    const data = await researchFileService.getAll()
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/research-files/:id
export const getById = async (req, res) => {
  try {
    const data = await researchFileService.getById(Number(req.params.id))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/research-files/medical-record/:medicalRecordId
export const getByMedicalRecord = async (req, res) => {
  try {
    const data = await researchFileService.getByMedicalRecord(Number(req.params.medicalRecordId))
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/research-files/unclassified
export const getUnclassified = async (req, res) => {
  try {
    const data = await researchFileService.getUnclassified()
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// GET /api/research-files/status/:status
export const getByStatus = async (req, res) => {
  try {
    const data = await researchFileService.getByStatus(req.params.status)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// POST /api/research-files/upload
// multer middleware adds file info to req.file
export const upload = async (req, res) => {
  try {
    // req.file is provided by multer middleware
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const data = await researchFileService.upload({
      medical_record_id: Number(req.body.medical_record_id),
      file_path: req.file.path
    })

    res.status(201).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/research-files/:id/classify
export const classify = async (req, res) => {
  try {
    const data = await researchFileService.classify(
      Number(req.params.id),
      Number(req.body.research_id)
    )
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// PATCH /api/research-files/:id/status
export const updateStatus = async (req, res) => {
  try {
    const data = await researchFileService.updateStatus(Number(req.params.id), req.body.status)
    res.status(200).json(data)
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

// DELETE /api/research-files/:id
export const remove = async (req, res) => {
  try {
    await researchFileService.remove(Number(req.params.id))
    res.status(200).json({ message: 'Research file deleted successfully' })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

export async function downloadResearchFile(req, res) {
  const id = Number(req.params.id)
  const file = await prisma.researchFile.findUnique({ where: { id } })
  if (!file) return res.status(404).json({ error: 'not found' })

  const abs = path.resolve(process.cwd(), file.file_path)

  if (!fs.existsSync(abs)) {
    return res.status(404).json({ error: 'file missing on disk' })
  }

  res.contentType('application/pdf')
  res.sendFile(abs)
}
