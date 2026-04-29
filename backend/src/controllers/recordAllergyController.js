import * as recordAllergyService from '../services/recordAllergyService.js'

export const getByRecord = async (req, res, next) => {
  try {
    res.json(await recordAllergyService.getByRecord(Number(req.params.recordId)))
  } catch (err) { next(err) }
}

export const add = async (req, res, next) => {
  try {
    res.status(201).json(await recordAllergyService.add(req.body))
  } catch (err) { next(err) }
}

export const update = async (req, res, next) => {
  try {
    res.json(await recordAllergyService.update(Number(req.params.id), req.body))
  } catch (err) { next(err) }
}

export const remove = async (req, res, next) => {
  try {
    await recordAllergyService.remove(Number(req.params.id))
    res.status(204).send()
  } catch (err) { next(err) }
}