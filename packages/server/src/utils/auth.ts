import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only_please_change'

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

export const verifyDjangoPassword = (password: string, djangoHash: string): boolean => {
    try {
        const parts = djangoHash.split('$')
        if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') {
            return false
        }
        const iterations = parseInt(parts[1], 10)
        const salt = parts[2]
        const hash = parts[3]

        const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256')
        return derivedKey.toString('base64') === hash
    } catch (err) {
        return false
    }
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    if (hash && hash.startsWith('pbkdf2_sha256$')) {
        return verifyDjangoPassword(password, hash)
    }
    return bcrypt.compare(password, hash)
}

export const generateToken = (userId: string | number): string => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string): any => {
    return jwt.verify(token, JWT_SECRET)
}
