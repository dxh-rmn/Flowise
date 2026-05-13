import express from 'express'
import webhookListenerController from '../../controllers/webhook-listener'

const router = express.Router()

const requireFlowEdit = (req: any, res: any, next: any) => next()

router.post('/:id/register', requireFlowEdit, webhookListenerController.registerListener)
router.get('/:id/stream/:listenerId', requireFlowEdit, webhookListenerController.streamListener)
router.delete('/:id/listener/:listenerId', requireFlowEdit, webhookListenerController.unregisterListener)

export default router
