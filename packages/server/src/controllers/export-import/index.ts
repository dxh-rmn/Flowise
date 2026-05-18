import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import exportImportService from '../../services/export-import'

const exportData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Error: exportImportController.exportData - user ${userId} not found!`)
        }
        const apiResponse = await exportImportService.exportData(exportImportService.convertExportInput(req.body), userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const importData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Error: exportImportController.importData - user ${userId} not found!`)
        }
        const subscriptionId = ''

        const importData = req.body
        if (!importData) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: exportImportController.importData - importData is required!')
        }

        await exportImportService.importData(importData, userId, subscriptionId)
        return res.status(StatusCodes.OK).json({ message: 'success' })
    } catch (error) {
        next(error)
    }
}

const exportChatflowMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: exportImportController.exportChatflowMessages - user ${userId} not found!`
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
