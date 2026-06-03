import * as medicationService from '../services/medicationService.js'

export const getAll = async (req, res, next) => {
  try {
    res.json(await medicationService.getAll())
  } catch (err) { next(err) }
}

export const getById = async (req, res, next) => {
  try {
    res.json(await medicationService.getById(Number(req.params.id)))
  } catch (err) { next(err) }
}

export const search = async (req, res, next) => {
  try {
    res.json(await medicationService.search(req.query.q ?? ''))
  } catch (err) { next(err) }
}

export const create = async (req, res, next) => {
  try {
    res.status(201).json(await medicationService.create(req.body))
  } catch (err) { next(err) }
}

export const update = async (req, res, next) => {
  try {
    res.json(await medicationService.update(Number(req.params.id), req.body))
  } catch (err) { next(err) }
}

export const remove = async (req, res, next) => {
  try {
    await medicationService.remove(Number(req.params.id))
    res.status(204).send()
  } catch (err) { next(err) }
}