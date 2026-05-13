const fs = require('fs')

function replaceFile(path, fromRegex, toStr) {
    if (fs.existsSync(path)) {
        let c = fs.readFileSync(path, 'utf8')
        c = c.replace(fromRegex, toStr)
        fs.writeFileSync(path, c, 'utf8')
    }
}

// 1. Duplicate userId in Interface.DocumentStore.ts
replaceFile('packages/server/src/Interface.DocumentStore.ts', /userId\?: string;\s+userId\?: string;/g, 'userId?: string;')
replaceFile('packages/server/src/Interface.DocumentStore.ts', /userId\?: string;[\r\n\s]+userId\?: string;/g, 'userId?: string;')

// 2. commands/user.ts
replaceFile('packages/server/src/commands/user.ts', /import \{ User \}.*/g, '')
replaceFile(
    'packages/server/src/commands/user.ts',
    /const user = await appDataSource.getRepository\(User\)/g,
    'const user = await appDataSource.getRepository<any>("User")'
)

// 3. apikey/index.ts
replaceFile('packages/server/src/controllers/apikey/index.ts', /import \{ LoggedInUser \}.*/g, '')

// 4. chatflows/index.ts
replaceFile(
    'packages/server/src/controllers/chatflows/index.ts',
    /import \{ WorkspaceUserService \} from '\.\.\/\.\.\/enterprise\/services\/workspace-user\.service'/g,
    ''
)

// 5. ScheduleExecutor.ts
replaceFile('packages/server/src/schedule/ScheduleExecutor.ts', /productId: undefined/g, 'productId: ""')

// 6. assistants/index.ts Workspace
replaceFile(
    'packages/server/src/services/assistants/index.ts',
    /import \{ Workspace \} from '\.\.\/\.\.\/enterprise\/database\/entities\/workspace\.entity'/g,
    ''
)

// 7. chatflows/index.ts Workspace
replaceFile(
    'packages/server/src/services/chatflows/index.ts',
    /import \{ Workspace \} from '\.\.\/\.\.\/enterprise\/database\/entities\/workspace\.entity'/g,
    ''
)

// 8. credentials/index.ts WorkspaceService
replaceFile(
    'packages/server/src/services/credentials/index.ts',
    /import \{ WorkspaceService \} from '\.\.\/\.\.\/enterprise\/services\/workspace\.service'/g,
    ''
)

// 9. marketplaces/index.ts WorkspaceService
replaceFile(
    'packages/server/src/services/marketplaces/index.ts',
    /import \{ WorkspaceService \} from '\.\.\/\.\.\/enterprise\/services\/workspace\.service'/g,
    ''
)

// 10. buildChatflow.ts undefined string
let bcf = fs.readFileSync('packages/server/src/utils/buildChatflow.ts', 'utf8')
bcf = bcf.replace(/const productId = await appServer\.undefined/g, 'const productId = ""')
fs.writeFileSync('packages/server/src/utils/buildChatflow.ts', bcf, 'utf8')

// 11. sanitize.util.test.ts
replaceFile(
    'packages/server/src/utils/sanitize.util.test.ts',
    /import \{ sanitizeAuditMetadata, sanitizeIPAddress, sanitizeNullBytes, sanitizeUser \}.*/g,
    "import { sanitizeAuditMetadata, sanitizeIPAddress, sanitizeNullBytes } from '../../src/utils/sanitize.util'"
)

// 12. upsertVector.ts undefined string
replaceFile('packages/server/src/utils/upsertVector.ts', /productId: undefined/g, 'productId: ""')
