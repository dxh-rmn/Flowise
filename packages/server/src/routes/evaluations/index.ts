import express from 'express'
import evaluationsController from '../../controllers/evaluations'
const router = express.Router()

router.get('/', evaluationsController.getAllEvaluations)
router.get('/:id', evaluationsController.getEvaluation)
router.delete('/:id', evaluationsController.deleteEvaluation)
router.post('/', evaluationsController.createEvaluation)
router.get('/is-outdated/:id', evaluationsController.isOutdated)
router.post('/run-again/:id', evaluationsController.runAgain)
router.get('/versions/:id', evaluationsController.getVersions)
router.patch('/', evaluationsController.patchDeleteEvaluations)
export default router
