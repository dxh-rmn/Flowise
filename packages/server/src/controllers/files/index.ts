import path from 'path'
import { NextFunction, Request, Response } from 'express'
import { getFilesListFromStorage, getStoragePath, removeSpecificFileFromStorage } from 'flowise-components'
import { updateStorageUsage } from '../../utils/quotaUsage'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

const getAllFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.user?.id
        if (!id) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Error: filesController.getAllFiles - user ${id} not found!`)
        }
        const apiResponse = await getFilesListFromStorage(id)
        const filesList = apiResponse.map((file: any) => ({
            ...file,
            // replace user id because we don't want to expose it
            path: file.path.replace(getStoragePath(), '').replace(`${path.sep}${id}${path.sep}`, '')
        }))
        return res.json(filesList)
    } catch (error) {
        next(error)
    }
}

const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.user?.id
        if (!id) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Error: filesController.deleteFile - user ${id} not found!`)
        }

        const filePath = req.query.path as string
        const paths = filePath.split(path.sep).filter((path) => path !== '')
        const { totalSize } = await removeSpecificFileFromStorage(id, ...paths)
        await updateStorageUsage(id, totalSize, getRunningExpressApp().usageCacheManager)
        return res.json({ message: 'file_deleted' })
    } catch (error) {
        next(error)
    }
}

export default {
    getAllFiles,
    deleteFile
}
