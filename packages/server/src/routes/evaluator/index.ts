import express from 'express'
import evaluatorsController from '../../controllers/evaluators'
const router = express.Router()

// get all datasets
router.get('/', evaluatorsController.getAllEvaluators)
// get new dataset
router.get(['/', '/:id'], evaluatorsController.getEvaluator)
// Create new dataset
router.post(['/', '/:id'], evaluatorsController.createEvaluator)
// Update dataset
router.put(['/', '/:id'], evaluatorsController.updateEvaluator)
// Delete dataset via id
router.delete(['/', '/:id'], evaluatorsController.deleteEvaluator)

export default router
