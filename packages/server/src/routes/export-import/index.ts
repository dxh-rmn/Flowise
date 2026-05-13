import express from 'express'
import exportImportController from '../../controllers/export-import'
const router = express.Router()

router.post('/export', exportImportController.exportData)

router.post('/chatflow-messages', exportImportController.exportChatflowMessages)

router.post('/import', exportImportController.importData)

export default router
