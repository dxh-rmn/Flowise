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

        if (!decoded || (!decoded.id && !decoded.user_id)) {
            return res.status(401).json({ error: 'Invalid Token' })
        }

        // @ts-ignore
        req.user = {
            id: String(decoded.id || decoded.user_id)
        }
        next()
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized Access' })
    }
}
