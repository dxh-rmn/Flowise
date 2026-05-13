import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only_please_change'

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash)
}

export const generateToken = (userId: string): string => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string): any => {
    return jwt.verify(token, JWT_SECRET)
}
