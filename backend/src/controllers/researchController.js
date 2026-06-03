import * as researchService from '../services/researchService.js'

export const getAll = async (req, res, next) => {
  try {
    res.json(await researchService.getAll())
  } catch (err) { next(err) }
}

export const getById = async (req, res, next) => {
  try {
    res.json(await researchService.getById(Number(req.params.id)))
  } catch (err) { next(err) }
}

export const getByMedicalRecord = async (req, res, next) => {
  try {
    res.json(await researchService.getByMedicalRecord(Number(req.params.medicalRecordId)))
  } catch (err) { next(err) }
}

export const getByCase = async (req, res, next) => {
  try {
    res.json(await researchService.getByCase(Number(req.params.caseId)))
  } catch (err) { next(err) }
}

export const getByStatus = async (req, res, next) => {
  try {
    res.json(await researchService.getByStatus(req.params.status))
  } catch (err) { next(err) }
}

export const getUnclassified = async (req, res, next) => {
  try {
    res.json(await researchService.getUnclassified())
  } catch (err) { next(err) }
}

export const create = async (req, res, next) => {
  try {
    res.status(201).json(await researchService.create(req.body))
  } catch (err) { next(err) }
}

export const update = async (req, res, next) => {
  try {
    res.json(await researchService.update(Number(req.params.id), req.body))
  } catch (err) { next(err) }
}

export const updateStatus = async (req, res, next) => {
  try {
    res.json(await researchService.updateStatus(Number(req.params.id), req.body.status))
  } catch (err) { next(err) }
}

export const assignToCase = async (req, res, next) => {
  try {
    res.json(await researchService.assignToCase(Number(req.params.id), req.body.case_id))
  } catch (err) { next(err) }
}

export const remove = async (req, res, next) => {
  try {
    await researchService.remove(Number(req.params.id))
    res.status(204).send()
  } catch (err) { next(err) }
}