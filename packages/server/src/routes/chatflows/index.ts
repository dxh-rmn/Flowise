import express from 'express'
import chatflowsController from '../../controllers/chatflows'
const router = express.Router()

// CREATE
router.post('/', chatflowsController.saveChatflow)

// READ
router.get('/', chatflowsController.getAllChatflows)
router.get(['/', '/:id'], chatflowsController.getChatflowById)
router.get(['/apikey/', '/apikey/:apikey'], chatflowsController.getChatflowByApiKey)

// UPDATE
router.put(['/', '/:id'], chatflowsController.updateChatflow)

// DELETE
router.delete(['/', '/:id'], chatflowsController.deleteChatflow)

// WEBHOOK SECRET
router.post('/:id/webhook-secret', chatflowsController.setWebhookSecret)
router.delete('/:id/webhook-secret', chatflowsController.clearWebhookSecret)

// CHECK FOR CHANGE
router.get('/has-changed/:id/:lastUpdatedDateTime', chatflowsController.checkIfChatflowHasChanged)

// SCHEDULE
router.get('/:id/schedule/status', chatflowsController.getScheduleStatus)
router.patch('/:id/schedule/enabled', chatflowsController.toggleScheduleEnabled)
router.get('/:id/schedule/trigger-logs', chatflowsController.getScheduleTriggerLogs)
router.delete('/:id/schedule/trigger-logs', chatflowsController.deleteScheduleTriggerLogs)

export default router
