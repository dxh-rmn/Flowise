import express from 'express'
import logController from '../../controllers/log'
const router = express.Router()

// READ
router.get('/', logController.getLogs)

export default router
