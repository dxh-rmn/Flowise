const fs = require('fs')
const path = require('path')

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return
    let content = fs.readFileSync(filePath, 'utf8')
    let changed = false

    // 1. Remove `import` lines causing Cannot find module
    content = content.replace(/import\s+.*from\s+['"]\.\.\/enterprise\/.*['"]\n?/g, '')

    // 2. Remove Workspace/Organization fetch blocks completely
    content = content.replace(
        /const workspace = await appServer\.AppDataSource\.getRepository\(Workspace\)\.findOneBy\(\{[^}]+\}\)/g,
        'const workspace = undefined;'
    )
    content = content.replace(
        /const org = await appServer\.AppDataSource\.getRepository\(Organization\)\.findOneBy\(\{[^}]+\}\)/g,
        'const org = undefined;'
    )

    // 3. Remove IdentityManager.getProductIdFromSubscription
    content = content.replace(/await identityManager\.getProductIdFromSubscription\([^)]+\)/g, 'undefined')

    // 4. Remove Role references
    if (content.includes('Role')) {
        content = content.replace(/import\s+\{.*Role.*\}\s+from\s+['"].*['"]\n?/g, '')
    }

    // 5. Replace LoggedInUser with any
    if (content.includes('LoggedInUser')) {
        content = content.replace(/: LoggedInUser/g, ': any')
        content = content.replace(/<LoggedInUser>/g, '<any>')
    }

    // 6. Fix `workspaceId:` -> `userId:`
    // but only if it's not a generic assignment. Let's just do `workspaceId:` -> `userId:`
    if (content.includes('workspaceId:')) {
        content = content.replace(/workspaceId:/g, 'userId:')
    }
    // and `workspaceId` as a shorthand
    if (content.includes('workspaceId,')) {
        content = content.replace(/workspaceId,/g, 'userId,')
    }

    // 7. constants.ts SSO removal
    if (filePath.endsWith('constants.ts')) {
        content = content.replace(/\[\s*AzureSSO.*?GithubSSO.*?\]/gs, '[]')
        content = content.replace(/AzureSSO,/g, '')
        content = content.replace(/GoogleSSO,/g, '')
        content = content.replace(/Auth0SSO,/g, '')
        content = content.replace(/GithubSSO,/g, '')
        content = content.replace(/AzureSSO/g, '')
        content = content.replace(/GoogleSSO/g, '')
        content = content.replace(/Auth0SSO/g, '')
        content = content.replace(/GithubSSO/g, '')
    }

    // 8. Fix `workspaceUserErrorMessage`
    if (content.includes('WorkspaceUserService')) {
        content = content.replace(/const workspaceUserService = new WorkspaceUserService\(\)/g, '')
        content = content.replace(/await workspaceUserService\.[a-zA-Z0-9_]+\([^)]+\)/g, 'undefined')
    }
    if (content.includes('WorkspaceUserErrorMessage')) {
        content = content.replace(/WorkspaceUserErrorMessage\.[a-zA-Z0-9_]+/g, '""')
    }

    // 9. Remove `userId` from PredictionQueue where not supported
    if (filePath.endsWith('PredictionQueue.ts') && content.includes('userId: chatflow.userId')) {
        content = content.replace(/userId: chatflow\.userId,/g, '')
        content = content.replace(/userId: chatflow\.userId/g, '')
    }

    // 10. `User` missing in sanitize.util.ts
    if (filePath.endsWith('sanitize.util.ts') && content.includes('User')) {
        content = content.replace(/User/g, 'any')
    }

    // 11. `WorkspaceShared` missing
    if (content.includes('WorkspaceShared')) {
        content = content.replace(/await appServer\.AppDataSource\.getRepository\(WorkspaceShared\)\.[a-zA-Z0-9_]+\([^)]+\)/g, '0')
    }

    // 12. Fix IDocumentStoreFileChunkPagedResponse missing userId
    if (filePath.endsWith('services/documentstore/index.ts')) {
        content = content.replace(/userId: userId/g, '')
    }

    // 13. Fix `undefined` assignable to `string` in schedule
    if (filePath.endsWith('ScheduleExecutor.ts')) {
        content = content.replace(/const orgId = undefined/g, 'const orgId = ""')
    }

    // 14. Fix BuildFlowParams userId
    if (filePath.endsWith('services/openai-realtime/index.ts')) {
        content = content.replace(/userId: req\.user\?\.id/g, '')
    }

    // 15. IExecuteNodeParams missing workspaceId
    if (filePath.endsWith('buildAgentflow.ts')) {
        content = content.replace(/userId: chatflow\.userId/g, '')
    }

    // 16. Fix chatflowWorkspaceId
    if (content.includes('const chatflowWorkspaceId = chatflow.userId')) {
        content = content.replace(/const chatflowWorkspaceId = chatflow\.userId/g, '')
        content = content.replace(/id: chatflowWorkspaceId/g, 'id: chatflow.userId')
        content = content.replace(/Workspace \${chatflowWorkspaceId} not found/g, 'Workspace ${chatflow.userId} not found')
    }

    if (content !== fs.readFileSync(filePath, 'utf8')) {
        fs.writeFileSync(filePath, content, 'utf8')
        console.log('Fixed residuals in: ' + filePath)
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return
    const files = fs.readdirSync(dir)
    for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        if (stat.isDirectory()) {
            walkDir(filePath)
        } else if (filePath.endsWith('.ts')) {
            processFile(filePath)
        }
    }
}

walkDir(path.join(__dirname, 'packages/server/src'))
