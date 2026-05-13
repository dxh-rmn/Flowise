import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { AssistantType } from '../../Interface'
import assistantsService from '../../services/assistants'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { checkUsageLimit } from '../../utils/quotaUsage'

const createAssistant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: assistantsController.createAssistant - body not provided!`
            )
        }
        const body = req.body
        const orgId = req.user?.activeOrganizationId
        if (!orgId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: assistantsController.createAssistant - organization ${orgId} not found!`
            )
        }
        const userId = req.user?.activeWorkspaceId
        if (!userId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: assistantsController.createAssistant - workspace ${userId} not found!`
            )
        }
        const subscriptionId = req.user?.activeOrganizationSubscriptionId || ''

        const existingAssistantCount = await assistantsService.getAssistantsCountByOrganization(body.type, orgId)
        const newAssistantCount = 1
        await checkUsageLimit('flows', subscriptionId, getRunningExpressApp().usageCacheManager, existingAssistantCount + newAssistantCount)

        const apiResponse = await assistantsService.createAssistant(body, orgId, userId)

        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const deleteAssistant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: assistantsController.deleteAssistant - id not provided!`
            )
        }
        const userId = req.user?.activeWorkspaceId
        if (!userId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: assistantsController.deleteAssistant - workspace ${userId} not found!`
            )
        }
        const apiResponse = await assistantsService.deleteAssistant(req.params.id, req.query.isDeleteBoth, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getAllAssistants = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const type = req.query.type as AssistantType
        const userId = req.user?.activeWorkspaceId
        if (!userId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: assistantsController.getAllAssistants - workspace ${userId} not found!`
            )
        }
        const apiResponse = await assistantsService.getAllAssistants(userId, type)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getAssistantById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: assistantsController.getAssistantById - id not provided!`
            )
        }
        const userId = req.user?.activeWorkspaceId
        if (!userId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: assistantsController.getAssistantById - workspace ${userId} not found!`
            )
        }
        const apiResponse = await assistantsService.getAssistantById(req.params.id, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const updateAssistant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: assistantsController.updateAssistant - id not provided!`
            )
        }
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: assistantsController.updateAssistant - body not provided!`
            )
        }
        const userId = req.user?.activeWorkspaceId
        if (!userId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: assistantsController.updateAssistant - workspace ${userId} not found!`
            )
        }
        const apiResponse = await assistantsService.updateAssistant(req.params.id, req.body, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getChatModels = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await assistantsService.getChatModels()
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getDocumentStores = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.activeWorkspaceId
        if (!userId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: assistantsController.getDocumentStores - workspace ${userId} not found!`
            )
        }
        const apiResponse = await assistantsService.getDocumentStores(userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getTools = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await assistantsService.getTools()
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const generateAssistantInstruction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: assistantsController.generateAssistantInstruction - body not provided!`
            )
        }
        const apiResponse = await assistantsService.generateAssistantInstruction(req.body.task, req.body.selectedChatModel)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    createAssistant,
    deleteAssistant,
    getAllAssistants,
    getAssistantById,
    updateAssistant,
    getChatModels,
    getDocumentStores,
    getTools,
    generateAssistantInstruction
}
