import { INodeParams, INodeCredential } from '../src/Interface'

class TelegramApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Telegram Bot API'
        this.name = 'telegramApi'
        this.version = 1.0
        this.description = 'Telegram Bot API token obtained from @BotFather'
        this.inputs = [
            {
                label: 'Bot Token',
                name: 'botToken',
                type: 'password',
                placeholder: '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
                description: 'Telegram Bot API Token provided by @BotFather'
            },
            {
                label: 'API Base URL',
                name: 'baseUrl',
                type: 'string',
                default: 'https://api.telegram.org',
                optional: true,
                description:
                    'Telegram Bot API server base URL. Defaults to https://api.telegram.org (change only for local Bot API servers or proxies)'
            }
        ]
    }
}

module.exports = { credClass: TelegramApi }
