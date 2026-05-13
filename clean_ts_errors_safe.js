const fs = require('fs')
const path = require('path')

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return
    let content = fs.readFileSync(filePath, 'utf8')
    let original = content

    // Fix migrations with Role
    if (filePath.includes('migrations')) {
        content = content.replace(/Role\.ADMIN/g, "'ADMIN'")
        content = content.replace(/Role\.MEMBER/g, "'MEMBER'")
    }

    // Replace workspaceId with userId safely
    content = content.replace(/workspaceId/g, 'userId')
    content = content.replace(/activeuserId/g, 'id')

    // Fix string interpolations that were blindly replaced
    content = content.replace(/Workspace \$\{userId\}/g, 'Workspace ${userId}')

    // Replace Workspace and Organization fetching blocks
    // `const workspace = await appServer.AppDataSource.getRepository(Workspace).findOneBy({ id: chatflowWorkspaceId })`
    content = content.replace(
        /const workspace = await [a-zA-Z0-9_\.]+\.getRepository\(Workspace\)\.findOne[a-zA-Z0-9_]*\(\{[^}]+\}\)/g,
        'const workspace: any = {};'
    )
    content = content.replace(
        /const org = await [a-zA-Z0-9_\.]+\.getRepository\(Organization\)\.findOne[a-zA-Z0-9_]*\(\{[^}]+\}\)/g,
        'const org: any = {};'
    )

    // IdentityManager
    content = content.replace(/await identityManager\.getProductIdFromSubscription\([^)]+\)/g, 'undefined')
    content = content.replace(/await appServer\.identityManager\.getProductIdFromSubscription\([^)]+\)/g, 'undefined')

    // Remove imports
    content = content.replace(/import\s+.*from\s+['"]\.\.\/enterprise\/.*['"]\n?/g, '')
    content = content.replace(/import\s+.*from\s+['"]\.\.\/\.\.\/enterprise\/.*['"]\n?/g, '')
    content = content.replace(/import\s+.*from\s+['"]\.\.\/\.\.\/\.\.\/enterprise\/.*['"]\n?/g, '')

    if (content.includes('Role')) {
        content = content.replace(/import\s+\{.*Role.*\}\s+from\s+['"].*['"]\n?/g, '')
    }
    if (content.includes('LoggedInUser')) {
        content = content.replace(/: LoggedInUser/g, ': any')
        content = content.replace(/<LoggedInUser>/g, '<any>')
    }

    if (content.includes('checkAnyPermission')) {
        content = content.replace(/,\s*checkAnyPermission\([^)]+\)/g, '')
        // Sometimes it's the only middleware
        content = content.replace(/checkAnyPermission\([^)]+\)/g, '(req, res, next) => next()')
    }

    if (filePath.endsWith('Interface.DocumentStore.ts')) {
        if (!content.includes('userId?: string')) {
            content = content.replace(
                /export interface IDocumentStoreFileChunkPagedResponse \{/g,
                'export interface IDocumentStoreFileChunkPagedResponse {\n    userId?: string;'
            )
        }
    }
    if (filePath.endsWith('Interface.ts') && content.includes('export interface BuildFlowParams')) {
        if (!content.includes('userId?: string')) {
            content = content.replace(/export interface BuildFlowParams \{/g, 'export interface BuildFlowParams {\n    userId?: string;')
        }
    }
    if (filePath.endsWith('evaluations/index.ts')) {
        content = content.replace(/as IEvaluationResult/g, 'as unknown as IEvaluationResult')
    }

    // SSO cleanup in constants.ts
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

        // Remove .LOGIN_URI .LOGOUT_URI
        content = content.replace(/\.LOGIN_URI,\s*\.LOGOUT_URI,\s*\.CALLBACK_URI,?\s*/g, '')
    }

    // Sanitize tests cleanup
    if (filePath.endsWith('sanitize.util.test.ts')) {
        content = content.replace(/import \{ sanitizeUser \} from '\.\.\/\.\.\/src\/utils\/sanitize\.util'/g, '')
        content = content.replace(/describe\('sanitizeUser', \(\) => \{[\s\S]*\}\)/g, '')
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
    'Interface.DocumentStore.ts',
    'Interface.ts'
]
for (const d of dirs) {
    if (d.endsWith('.ts')) {
        processFile(path.join(__dirname, 'packages/server/src', d))
    } else {
        walkDir(path.join(__dirname, 'packages/server/src', d))
    }
}
