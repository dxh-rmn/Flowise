import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import exportImportService from '../../services/export-import'

const exportData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.activeWorkspaceId
        if (!userId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: exportImportController.exportData - workspace ${userId} not found!`
            )
        }
        const apiResponse = await exportImportService.exportData(exportImportService.convertExportInput(req.body), userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const importData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orgId = req.user?.activeOrganizationId
        if (!orgId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: exportImportController.importData - organization ${orgId} not found!`
            )
        }
        const userId = req.user?.activeWorkspaceId
        if (!userId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: exportImportController.importData - workspace ${userId} not found!`
            )
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId || ''

        const importData = req.body
        if (!importData) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: exportImportController.importData - importData is required!')
        }

        await exportImportService.importData(importData, orgId, userId, subscriptionId)
        return res.status(StatusCodes.OK).json({ message: 'success' })
    } catch (error) {
        next(error)
    }
}

const exportChatflowMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.activeWorkspaceId
        if (!userId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: exportImportController.exportChatflowMessages - workspace ${userId} not found!`
            )
        }

        const { chatflowId, chatType, feedbackType, startDate, endDate } = req.body
        if (!chatflowId) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                'Error: exportImportController.exportChatflowMessages - chatflowId is required!'
            )
        }

        const apiResponse = await exportImportService.exportChatflowMessages(chatflowId, chatType, feedbackType, startDate, endDate, userId)

        // Set headers for file download
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Disposition', `attachment; filename="${chatflowId}-Message.json"`)

        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    exportData,
    importData,
    exportChatflowMessages
}
