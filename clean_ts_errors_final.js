const fs = require('fs')

function replaceFile(path, fromRegex, toStr) {
    if (fs.existsSync(path)) {
        let c = fs.readFileSync(path, 'utf8')
        c = c.replace(fromRegex, toStr)
        fs.writeFileSync(path, c, 'utf8')
    }
}

// 1. Duplicate userId
replaceFile('packages/server/src/Interface.DocumentStore.ts', /userId\?: string;\n\s+userId\?: string;/g, 'userId?: string;')

// 2. user.ts
replaceFile('packages/server/src/commands/user.ts', /import\s*\{.*User.*\}\s*from\s*['"][^'"]+['"]/g, '')
replaceFile('packages/server/src/commands/user.ts', /User/g, 'any')
replaceFile(
    'packages/server/src/commands/user.ts',
    /const user = await appDataSource\.getRepository\(any\)/g,
    'const user = await appDataSource.getRepository<any>("User")'
)
replaceFile('packages/server/src/commands/user.ts', /validatePasswordOrThrow\([^)]+\)/g, 'undefined')
replaceFile('packages/server/src/commands/user.ts', /getHash\([^)]+\)/g, '""')

// 3. apikey
replaceFile('packages/server/src/controllers/apikey/index.ts', /import\s*\{.*LoggedInUser.*\}\s*from\s*['"][^'"]+['"]/g, '')
replaceFile('packages/server/src/controllers/apikey/index.ts', /: LoggedInUser/g, ': any')
replaceFile('packages/server/src/controllers/apikey/index.ts', /<LoggedInUser>/g, '<any>')

// 4. chatflows controller WorkspaceUserService
replaceFile('packages/server/src/controllers/chatflows/index.ts', /const workspaceUserService = new WorkspaceUserService\(\)/g, '')
replaceFile('packages/server/src/controllers/chatflows/index.ts', /await workspaceUserService\.[a-zA-Z0-9_]+\([^)]+\)/g, 'undefined')
replaceFile('packages/server/src/controllers/chatflows/index.ts', /WorkspaceUserErrorMessage\.[a-zA-Z0-9_]+/g, '""')

// 5. ScheduleExecutor
replaceFile('packages/server/src/schedule/ScheduleExecutor.ts', /productId: undefined/g, 'productId: ""')
replaceFile('packages/server/src/schedule/ScheduleExecutor.ts', /subscriptionId: undefined/g, 'subscriptionId: ""')

// 6. assistants Workspace
replaceFile(
    'packages/server/src/services/assistants/index.ts',
    /const workspace = await appDataSource\.getRepository\(Workspace\)\.findOneBy\(\{[^}]+\}\)/g,
    'const workspace: any = {};'
)

// 7. chatflows service Workspace
replaceFile(
    'packages/server/src/services/chatflows/index.ts',
    /const workspace = await appDataSource\.getRepository\(Workspace\)\.findOneBy\(\{[^}]+\}\)/g,
    'const workspace: any = {};'
)

// 8. credentials WorkspaceService
replaceFile('packages/server/src/services/credentials/index.ts', /const workspaceService = new WorkspaceService\(\)/g, '')
replaceFile('packages/server/src/services/credentials/index.ts', /await workspaceService\.[a-zA-Z0-9_]+\([^)]+\)/g, 'undefined')
replaceFile('packages/server/src/services/credentials/index.ts', /getWorkspaceSearchOptions\([^)]+\)/g, '{}')

// 9. marketplaces WorkspaceService
replaceFile('packages/server/src/services/marketplaces/index.ts', /const workspaceService = new WorkspaceService\(\)/g, '')
replaceFile('packages/server/src/services/marketplaces/index.ts', /await workspaceService\.[a-zA-Z0-9_]+\([^)]+\)/g, 'undefined')

// 10. buildChatflow.ts undefined string
replaceFile('packages/server/src/utils/buildChatflow.ts', /productId: await appServer.undefined/g, 'productId: ""')
replaceFile('packages/server/src/utils/buildChatflow.ts', /productId/g, 'productId: ""') // careful
let bcf = fs.readFileSync('packages/server/src/utils/buildChatflow.ts', 'utf8')
bcf = bcf.replace(/productId = await appServer\.undefined/g, 'productId = ""')
bcf = bcf.replace(/const productId = await appServer\.undefined/g, 'const productId = ""')
fs.writeFileSync('packages/server/src/utils/buildChatflow.ts', bcf, 'utf8')

// 11. sanitize.util.ts User
replaceFile('packages/server/src/utils/sanitize.util.ts', /User/g, 'any')

// 12. upsertVector.ts undefined string
replaceFile('packages/server/src/utils/upsertVector.ts', /productId: undefined/g, 'productId: ""')
replaceFile('packages/server/src/utils/upsertVector.ts', /subscriptionId: undefined/g, 'subscriptionId: ""')
