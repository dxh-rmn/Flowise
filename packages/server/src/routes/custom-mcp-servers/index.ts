import express from 'express'
import customMcpServersController from '../../controllers/custom-mcp-servers'

const router = express.Router()

// CREATE
router.post('/', customMcpServersController.createCustomMcpServer)

// READ
router.get('/', customMcpServersController.getAllCustomMcpServers)
router.get('/:id', customMcpServersController.getCustomMcpServerById)
router.get('/:id/tools', customMcpServersController.getDiscoveredTools)

// UPDATE
router.put('/:id', customMcpServersController.updateCustomMcpServer)

// AUTHORIZE (connect to server & discover tools)
router.post('/:id/authorize', customMcpServersController.authorizeCustomMcpServer)

// DELETE
router.delete('/:id', customMcpServersController.deleteCustomMcpServer)

export default router
