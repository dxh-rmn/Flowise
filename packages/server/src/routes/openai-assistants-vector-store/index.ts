import express from 'express'
import openaiAssistantsVectorStoreController from '../../controllers/openai-assistants-vector-store'
import { getMulterStorage } from '../../utils'

const router = express.Router()

// CREATE
router.post('/', openaiAssistantsVectorStoreController.createAssistantVectorStore)

// READ
router.get('/:id', openaiAssistantsVectorStoreController.getAssistantVectorStore)

// LIST
router.get('/', openaiAssistantsVectorStoreController.listAssistantVectorStore)

// UPDATE
router.put(['/', '/:id'], openaiAssistantsVectorStoreController.updateAssistantVectorStore)

// DELETE
router.delete(['/', '/:id'], openaiAssistantsVectorStoreController.deleteAssistantVectorStore)

// UPLOAD FILES — permission check must precede multer to reject unauthorized requests before file parsing
router.post('/:id', getMulterStorage().array('files'), openaiAssistantsVectorStoreController.uploadFilesToAssistantVectorStore)

// DELETE FILES
router.patch(['/', '/:id'], openaiAssistantsVectorStoreController.deleteFilesFromAssistantVectorStore)

export default router
