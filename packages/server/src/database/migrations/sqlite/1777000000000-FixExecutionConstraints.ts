import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixExecutionConstraints1777000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // SQLite doesn't support DROP CONSTRAINT, so we create a temp table
        await queryRunner.query(`
            CREATE TABLE "temp_execution" (
                "id" varchar PRIMARY KEY NOT NULL,
                "chatflowid" varchar NOT NULL,
                "chatId" varchar NOT NULL,
                "status" varchar NOT NULL,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "stoppedDate" datetime
            );
        `)

        await queryRunner.query(`
            INSERT INTO "temp_execution" ("id", "chatflowid", "chatId", "status", "createdDate", "stoppedDate")
            SELECT "id", "chatflowid", "chatId", "status", "createdDate", "stoppedDate" FROM "execution";
        `)

        await queryRunner.query(`DROP TABLE "execution";`)
        await queryRunner.query(`ALTER TABLE "temp_execution" RENAME TO "execution";`)

        // Remove UNIQUE constraint from chat_message.executionId by rebuilding table
        await queryRunner.query(`
            CREATE TABLE "temp_chat_message" (
                "id" varchar PRIMARY KEY NOT NULL,
                "role" varchar NOT NULL,
                "chatflowid" varchar NOT NULL,
                "content" text NOT NULL,
                "sourceDocuments" text,
                "usedTools" text,
                "fileAnnotations" text,
                "fileUploads" text,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "chatType" varchar NOT NULL DEFAULT 'INTERNAL',
                "chatId" varchar NOT NULL,
                "memoryType" varchar,
                "sessionId" varchar,
                "leadEmail" varchar,
                "action" text,
                "artifacts" text,
                "reasoning" text,
                "executionId" varchar,
                FOREIGN KEY ("executionId") REFERENCES "execution"("id") ON DELETE CASCADE
            );
        `)

        await queryRunner.query(`
            INSERT INTO "temp_chat_message" ("id", "role", "chatflowid", "content", "sourceDocuments", "usedTools", "fileAnnotations", "fileUploads", "createdDate", "chatType", "chatId", "memoryType", "sessionId", "leadEmail", "action", "artifacts", "reasoning", "executionId")
            SELECT "id", "role", "chatflowid", "content", "sourceDocuments", "usedTools", "fileAnnotations", "fileUploads", "createdDate", "chatType", "chatId", "memoryType", "sessionId", "leadEmail", "action", "artifacts", "reasoning", "executionId" FROM "chat_message";
        `)

        await queryRunner.query(`DROP TABLE "chat_message";`)
        await queryRunner.query(`ALTER TABLE "temp_chat_message" RENAME TO "chat_message";`)
    }

    public async down(): Promise<void> {}
}
