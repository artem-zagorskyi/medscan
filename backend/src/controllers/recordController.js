import * as recordService from '../services/recordService.js'

export const getAll = async (req, res, next) => {
  try {
    const records = await recordService.getAllRecords()
    res.json(records)
  } catch (err) { next(err) }
}

export const getById = async (req, res, next) => {
  try {
    const found = await recordService.getRecordById(Number(req.params.id))
    res.json(found)
  } catch (err) { next(err) }
}

export const getByMedicalRecord = async (req, res, next) => {
  try {
    const records = await recordService.getRecordsByMedicalRecord(Number(req.params.medicalRecordId))
    res.json(records)
  } catch (err) { next(err) }
}

export const getByCase = async (req, res, next) => {
  try {
    const records = await recordService.getRecordsByCase(Number(req.params.caseId))
    res.json(records)
  } catch (err) { next(err) }
}

export const getByDoctor = async (req, res, next) => {
  try {
    const records = await recordService.getRecordsByDoctor(Number(req.params.doctorId))
    res.json(records)
  } catch (err) { next(err) }
}

export const create = async (req, res, next) => {
  try {
    const created = await recordService.createRecord(req.body)
    res.status(201).json(created)
  } catch (err) { next(err) }
}

export const update = async (req, res, next) => {
  try {
    const updated = await recordService.updateRecord(Number(req.params.id), req.body)
    res.json(updated)
  } catch (err) { next(err) }
}

export const sign = async (req, res, next) => {
  try {
    const signed = await recordService.signRecord(Number(req.params.id))
    res.json(signed)
  } catch (err) { next(err) }
}

export const remove = async (req, res, next) => {
  try {
    await recordService.deleteRecord(Number(req.params.id))
    res.status(204).send()
  } catch (err) { next(err) }
}