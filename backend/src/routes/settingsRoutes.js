// settings.routes.js
import { Router } from 'express'
import { getGpuUrl, updateGpuUrl } from '../controllers/settingsController.js'

const router = Router()
router.get('/gpu-url', getGpuUrl)
router.put('/gpu-url', updateGpuUrl)
export default router