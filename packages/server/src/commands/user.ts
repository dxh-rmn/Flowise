import { Args } from '@oclif/core'
import { QueryRunner } from 'typeorm'
import * as DataSource from '../DataSource'
import logger from '../utils/logger'
import { hashPassword } from '../utils/auth'
import { BaseCommand } from './base'

export default class user extends BaseCommand {
    static args = {
        email: Args.string({
            description: 'Email address to search for in the user database'
        }),
        password: Args.string({
            description: 'New password for that user'
        })
    }

    async run(): Promise<void> {
        const { args } = await this.parse(user)

        let queryRunner: QueryRunner | undefined
        try {
            logger.info('Initializing DataSource')
            const dataSource = await DataSource.getDataSource()
            await dataSource.initialize()

            queryRunner = dataSource.createQueryRunner()
            await queryRunner.connect()

            if (args.email && args.password) {
                logger.info('Running resetPassword')
                await this.resetPassword(queryRunner, args.email, args.password)
            } else {
                logger.info('Running listanyEmails')
                await this.listanyEmails(queryRunner)
            }
        } catch (error) {
            logger.error(error)
        } finally {
            if (queryRunner && !queryRunner.isReleased) await queryRunner.release()
            await this.gracefullyExit()
        }
    }

    async listanyEmails(queryRunner: QueryRunner) {
        logger.info('Listing all user emails')
        const users = await queryRunner.manager.find('User', {
            select: ['email']
        })

        const emails = users.map((user: any) => user.email)
        logger.info(`Email addresses: ${emails.join(', ')}`)
        logger.info(`Email count: ${emails.length}`)
        logger.info('To reset user password, run the following command: pnpm user --email "myEmail" --password "myPassword"')
    }

    async resetPassword(queryRunner: QueryRunner, email: string, password: string) {
        logger.info(`Finding user by email: ${email}`)
        const user: any = await queryRunner.manager.findOne('User', {
            where: { email }
        })
        if (!user) throw new Error(`User not found with email: ${email}`)

        const hashedPassword = await hashPassword(password)
        user.password = hashedPassword
        await queryRunner.manager.save('User', user)
        logger.info(`Password successfully reset for user: ${email}`)
    }
}
