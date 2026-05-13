import express from 'express'
import { getDataSource } from '../../DataSource'
import { User } from '../../database/entities/User'
import { hashPassword, comparePassword, generateToken } from '../../utils/auth'

const router = express.Router()

router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
        }

        const userRepository = getDataSource().getRepository(User)
        const existingUser = await userRepository.findOne({ where: { email } })

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' })
        }

        const hashedPassword = await hashPassword(password)
        const newUser = userRepository.create({
            email,
            password: hashedPassword,
            name
        })

        await userRepository.save(newUser)
        const token = generateToken(newUser.id)

        res.status(201).json({ token, user: { id: newUser.id, email: newUser.email, name: newUser.name } })
    } catch (error) {
        res.status(500).json({ error: 'Error registering user' })
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
        }

        const userRepository = getDataSource().getRepository(User)
        const user = await userRepository.findOne({ where: { email } })

        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const isMatch = await comparePassword(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const token = generateToken(user.id)
        res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name } })
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' })
    }
})

export default router
