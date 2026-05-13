import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import marketplacesService from '../../services/marketplaces'
import { stripProtectedFields } from '../../utils/stripProtectedFields'

// Get all templates for marketplaces
const getAllTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await marketplacesService.getAllTemplates()
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const deleteCustomTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: marketplacesService.deleteCustomTemplate - id not provided!`
            )
        }
        const userId = req.user?.activeWorkspaceId
        if (!userId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: marketplacesController.deleteCustomTemplate - workspace ${userId} not found!`
            )
        }
        const apiResponse = await marketplacesService.deleteCustomTemplate(req.params.id, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getAllCustomTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await marketplacesService.getAllCustomTemplates(req.user?.activeWorkspaceId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const saveCustomTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if ((!req.body && !(req.body.chatflowId || req.body.tool)) || !req.body.name) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: marketplacesService.saveCustomTemplate - body not provided!`
            )
        }
        const userId = req.user?.activeWorkspaceId
        if (!userId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: marketplacesController.saveCustomTemplate - workspace ${userId} not found!`
            )
        }
        const apiResponse = await marketplacesService.saveCustomTemplate({ ...stripProtectedFields(req.body), userId })
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    getAllTemplates,
    getAllCustomTemplates,
    saveCustomTemplate,
    deleteCustomTemplate
}
