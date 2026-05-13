const fs = require('fs')
const path = require('path')

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8')

    if (content.includes('workspaceId')) {
        content = content.replace(/workspaceId/g, 'userId')
        fs.writeFileSync(filePath, content, 'utf8')
        console.log('Updated: ' + filePath)
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        if (stat.isDirectory()) {
            walkDir(filePath)
        } else if (filePath.endsWith('.ts')) {
            replaceInFile(filePath)
        }
    }
}

walkDir(path.join(__dirname, 'packages/server/src/services'))
walkDir(path.join(__dirname, 'packages/server/src/controllers'))
walkDir(path.join(__dirname, 'packages/server/src/routes'))
