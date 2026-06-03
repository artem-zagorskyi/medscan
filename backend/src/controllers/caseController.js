import * as caseService from '../services/caseService.js'

export const getAll = async (req, res, next) => {
  try {
    const cases = await caseService.getAllCases()
    res.json(cases)
  } catch (err) { next(err) }
}

export const getById = async (req, res, next) => {
  try {
    const found = await caseService.getCaseById(Number(req.params.id))
    res.json(found)
  } catch (err) { next(err) }
}

export const getByMedicalRecord = async (req, res, next) => {
  try {
    const cases = await caseService.getCasesByMedicalRecord(Number(req.params.medicalRecordId))
    res.json(cases)
  } catch (err) { next(err) }
}

export const create = async (req, res, next) => {
  try {
    const created = await caseService.createCase(req.body)
    res.status(201).json(created)
  } catch (err) { next(err) }
}

export const update = async (req, res, next) => {
  try {
    const updated = await caseService.updateCase(Number(req.params.id), req.body)
    res.json(updated)
  } catch (err) { next(err) }
}

export const remove = async (req, res, next) => {
  try {
    await caseService.deleteCase(Number(req.params.id))
    res.status(204).send()
  } catch (err) { next(err) }
}