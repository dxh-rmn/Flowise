const fs = require('fs')
const path = require('path')

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return
    let content = fs.readFileSync(filePath, 'utf8')
    let original = content

    if (content.includes('getWorkspaceSearchOptionsFromReq')) {
        content = content.replace(/getWorkspaceSearchOptionsFromReq\([^)]+\)/g, '{}')
    }
    if (content.includes('getWorkspaceSearchOptions')) {
        content = content.replace(/getWorkspaceSearchOptions\([^)]+\)/g, '{}')
        content = content.replace(/getWorkspaceSearchOptions\(\)/g, '{}')
    }

    if (content.includes('WorkspaceShared')) {
        content = content.replace(/await appServer\.AppDataSource\.getRepository\(WorkspaceShared\)\.[a-zA-Z0-9_]+\([^)]+\)/g, 'undefined')
        content = content.replace(/await appDataSource\.getRepository\(WorkspaceShared\)\.[a-zA-Z0-9_]+\([^)]+\)/g, 'undefined')
    }

    if (content.includes('WorkspaceUserService')) {
        content = content.replace(/const workspaceUserService = new WorkspaceUserService\(\)/g, '')
        content = content.replace(/await workspaceUserService\.[a-zA-Z0-9_]+\([^)]+\)/g, 'undefined')
    }
    if (content.includes('WorkspaceUserErrorMessage')) {
        content = content.replace(/WorkspaceUserErrorMessage\.[a-zA-Z0-9_]+/g, '""')
    }

    if (content.includes('WorkspaceService')) {
        content = content.replace(/const workspaceService = new WorkspaceService\(\)/g, '')
        content = content.replace(/await workspaceService\.[a-zA-Z0-9_]+\([^)]+\)/g, 'undefined')
    }

    if (filePath.endsWith('Interface.DocumentStore.ts')) {
        content = content.replace(/userId\?: string;\n\s+userId\?: string;/g, 'userId?: string;')
    }

    if (filePath.endsWith('src/commands/user.ts') || filePath.endsWith('src/commands/user.ts')) {
        content = content.replace(/import \{ User \} from '\.\.\/enterprise\/database\/entities\/user.entity'/g, '')
        content = content.replace(
            /const user = await appDataSource\.getRepository\(User\)/g,
            'const user = await appDataSource.getRepository<any>("User")'
        )
        content = content.replace(/validatePasswordOrThrow\([^)]+\)/g, 'undefined')
        content = content.replace(/getHash\([^)]+\)/g, '""')
    }

    if (filePath.endsWith('controllers/apikey/index.ts')) {
        content = content.replace(/req\.user\?\.activeWorkspaceId/g, 'req.user?.id')
        content = content.replace(/req\.user\.activeWorkspaceId/g, 'req.user.id')
    }

    if (filePath.endsWith('webhook-listener/index.ts')) {
        content = content.replace(/\(req, res, next\)/g, '(req: any, res: any, next: any)')
    }

    if (filePath.endsWith('src/index.ts')) {
        content = content.replace(/verifyTokenForBullMQDashboard/g, 'authenticate')
    }

    if (filePath.endsWith('ScheduleExecutor.ts')) {
        content = content.replace(/const orgId = undefined/g, 'const orgId = ""')
    }

    if (filePath.includes('migrations')) {
        content = content.replace(/Role\.ADMIN/g, "'ADMIN'")
        content = content.replace(/Role\.MEMBER/g, "'MEMBER'")
        content = content.replace(/Role/g, 'any')
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8')
        console.log('Processed: ' + filePath)
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

const dirs = [
    'controllers',
    'services',
    'utils',
    'queue',
    'schedule',
    'database/migrations',
    'routes',
    'commands',
    'Interface.DocumentStore.ts',
    'Interface.ts',
    'index.ts'
]
for (const d of dirs) {
    if (d.endsWith('.ts')) {
        processFile(path.join(__dirname, 'packages/server/src', d))
    } else {
        walkDir(path.join(__dirname, 'packages/server/src', d))
    }
}
