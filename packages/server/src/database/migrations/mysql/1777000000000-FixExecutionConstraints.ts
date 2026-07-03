import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixExecutionConstraints1777000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`execution\` MODIFY \`stoppedDate\` datetime NULL;`)

        // MySQL uses DROP INDEX for unique constraints created by OneToOne
        try {
            await queryRunner.query(`ALTER TABLE \`chat_message\` DROP INDEX \`REL_617f10ebdc13a5941b01b34823\`;`)
        } catch (e) {
            // Ignore if index doesn't exist
        }
    }

    public async down(): Promise<void> {}
}
