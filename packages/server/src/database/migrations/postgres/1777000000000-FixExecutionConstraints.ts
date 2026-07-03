import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixExecutionConstraints1777000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "execution" ALTER COLUMN "stoppedDate" DROP NOT NULL;`)
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT IF EXISTS "REL_617f10ebdc13a5941b01b34823";`)
    }

    public async down(): Promise<void> {}
}
