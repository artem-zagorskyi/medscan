import * as recordMedicationService from '../services/recordMedicationService.js'

export const getByRecord = async (req, res, next) => {
  try {
    res.json(await recordMedicationService.getByRecord(Number(req.params.recordId)))
  } catch (err) { next(err) }
}

export const add = async (req, res, next) => {
  try {
    res.status(201).json(await recordMedicationService.add(req.body))
  } catch (err) { next(err) }
}

export const update = async (req, res, next) => {
  try {
    res.json(await recordMedicationService.update(Number(req.params.id), req.body))
  } catch (err) { next(err) }
}

export const remove = async (req, res, next) => {
  try {
    await recordMedicationService.remove(Number(req.params.id))
    res.status(204).send()
  } catch (err) { next(err) }
}