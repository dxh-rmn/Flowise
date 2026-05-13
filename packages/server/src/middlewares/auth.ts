import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/auth'

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized Access' })
        }

        const token = authHeader.split(' ')[1]
        const decoded = verifyToken(token)

        if (!decoded || !decoded.id) {
            return res.status(401).json({ error: 'Invalid Token' })
        }

        // @ts-ignore
        req.user = {
            id: decoded.id,
            activeWorkspaceId: decoded.id,
            activeOrganizationId: decoded.id
        }
        next()
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized Access' })
    }
}
