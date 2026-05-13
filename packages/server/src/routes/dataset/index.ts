import express from 'express'
import datasetController from '../../controllers/dataset'
const router = express.Router()

// get all datasets
router.get('/', datasetController.getAllDatasets)
// get new dataset
router.get(['/set', '/set/:id'], datasetController.getDataset)
// Create new dataset
router.post(['/set', '/set/:id'], datasetController.createDataset)
// Update dataset
router.put(['/set', '/set/:id'], datasetController.updateDataset)
// Delete dataset via id
router.delete(['/set', '/set/:id'], datasetController.deleteDataset)

// Create new row in a given dataset
router.post(['/rows', '/rows/:id'], datasetController.addDatasetRow)
// Update row for a dataset
router.put(['/rows', '/rows/:id'], datasetController.updateDatasetRow)
// Delete dataset row via id
router.delete(['/rows', '/rows/:id'], datasetController.deleteDatasetRow)
// PATCH delete by ids
router.patch('/rows', datasetController.patchDeleteRows)

// Update row for a dataset
router.post(['/reorder', '/reorder'], datasetController.reorderDatasetRow)

export default router
