import * as recordResearchService from '../services/recordResearchService.js'

export const getByRecord = async (req, res, next) => {
  try {
    res.json(await recordResearchService.getByRecord(Number(req.params.recordId)))
  } catch (err) { next(err) }
}

export const add = async (req, res, next) => {
  try {
    res.status(201).json(await recordResearchService.add(req.body))
  } catch (err) { next(err) }
}

export const remove = async (req, res, next) => {
  try {
    await recordResearchService.remove(Number(req.params.id))
    res.status(204).send()
  } catch (err) { next(err) }
}