const fs = require('fs')
const path = require('path')

function fixSyntaxErrors(filePath) {
    if (!fs.existsSync(filePath)) return
    let content = fs.readFileSync(filePath, 'utf8')
    let changed = false

    // Fix `{ userId:  }`
    if (content.includes('{ userId:  }')) {
        content = content.replace(/\{ userId:  \}/g, '{}')
        changed = true
    }

    // Fix `{ userId: .user?.id }`
    if (content.includes('{ userId: .user?.id }')) {
        content = content.replace(/\{ userId: \.user\?\.id \}/g, '{ userId: req.user?.id }')
        changed = true
    }

    // Replace getWorkspaceSearchOptions() without args
    if (content.includes('getWorkspaceSearchOptions()')) {
        content = content.replace(/getWorkspaceSearchOptions\(\)/g, '{}')
        changed = true
    }

    // Fix `import {  } from ` left over by removals
    if (content.match(/import\s+\{\s*\}\s+from\s+['"][^'"]+['"]/g)) {
        content = content.replace(/import\s+\{\s*\}\s+from\s+['"][^'"]+['"]\n?/g, '')
        changed = true
    }

    // Fix const sharedItems: any[] = [] with await missing something? No, I'll just check `const sharedItems: any[] = []` for syntax.
    // Let's also check for `/* workspaceService removed */` and subsequent lines if they are broken.
    if (content.includes('const sharedItems = await workspaceService')) {
        content = content.replace(
            /const sharedItems = await workspaceService\.getSharedItemsForWorkspace\([^)]+\)/g,
            'const sharedItems: any[] = []'
        )
        changed = true
    }

    // Catch `as Credential[]` left over: `const sharedItems: any[] = [] as Credential[]` -> `const sharedItems: any[] = []`
    if (content.includes('const sharedItems: any[] = [] as Credential[]')) {
        content = content.replace(/const sharedItems: any\[\] = \[\] as Credential\[\]/g, 'const sharedItems: any[] = []')
        changed = true
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8')
        console.log('Fixed syntax in: ' + filePath)
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
            fixSyntaxErrors(filePath)
        }
    }
}

walkDir(path.join(__dirname, 'packages/server/src'))
