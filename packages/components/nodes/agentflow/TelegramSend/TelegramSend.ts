import axios from 'axios'
import { getCredentialData } from '../../../src/utils'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class TelegramSend_Agentflow implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    color: string
    hideOutput: boolean
    hint: string
    baseClasses: string[]
    documentation?: string
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Telegram Send'
        this.name = 'telegramSendAgentflow'
        this.version = 1.0
        this.type = 'TelegramSend'
        this.category = 'Agent Flows'
        this.description = 'Send a message or reply to a Telegram chat, group, or channel via Telegram Bot API'
        this.baseClasses = [this.type]
        this.color = '#229ED9'
        this.icon = 'telegram.svg'
        this.hideOutput = false
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['telegramApi'],
            optional: true
        }
        this.inputs = [
            {
                label: 'Chat ID',
                name: 'chatId',
                type: 'string',
                placeholder: 'e.g. {{ $webhook.body.message.chat.id }}',
                description: 'Target chat ID or channel username (e.g. @channelusername) from Telegram webhook.',
                default: '{{ $webhook.body.message.chat.id }}',
                acceptVariable: true
            },
            {
                label: 'Message Text',
                name: 'messageText',
                type: 'string',
                rows: 4,
                placeholder: 'Type message or select dynamic output from previous agent node',
                description: 'Text message content to send.',
                acceptVariable: true
            },
            {
                label: 'Parse Mode',
                name: 'parseMode',
                type: 'options',
                options: [
                    {
                        label: 'None (Plain Text)',
                        name: 'none'
                    },
                    {
                        label: 'Markdown',
                        name: 'Markdown'
                    },
                    {
                        label: 'MarkdownV2',
                        name: 'MarkdownV2'
                    },
                    {
                        label: 'HTML',
                        name: 'HTML'
                    }
                ],
                default: 'none',
                description: 'Formatting mode for the message text.',
                optional: true
            },
            {
                label: 'Reply To Message ID',
                name: 'replyToMessageId',
                type: 'string',
                placeholder: 'e.g. {{ $webhook.body.message.message_id }}',
                description: 'If the message is a reply, the ID of the original message to reply to.',
                optional: true,
                acceptVariable: true
            },
            {
                label: 'Disable Link Preview',
                name: 'disableWebPagePreview',
                type: 'boolean',
                description: 'Disables link previews for links in this message.',
                optional: true,
                default: false
            },
            {
                label: 'Continue on Fail',
                name: 'continueOnFail',
                type: 'boolean',
                description:
                    'If enabled, the flow will not terminate if Telegram Bot API returns an error, but return the error in output instead.',
                optional: true,
                default: false
            }
        ]
    }

    async run(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData((nodeData.credential as string) ?? '', options)

        // Dynamic token resolution (supports multi-tenant user tokens passed via overrideConfig.vars)
        const dynamicToken =
            (options.overrideConfig?.vars?.userTelegramToken as string) || (options.overrideConfig?.vars?.telegramBotToken as string)

        const botToken = dynamicToken || (credentialData?.botToken as string)

        if (!botToken) {
            throw new Error('Telegram Bot Token is missing in credential or dynamic overrideConfig.')
        }

        const rawChatId = (nodeData.inputs?.chatId as string) || ''
        const chatId = rawChatId.replace(/<[^>]*>/g, '').trim()
        const messageText = (nodeData.inputs?.messageText as string) || ''
        const parseMode = (nodeData.inputs?.parseMode as string) || 'none'
        const rawReplyToId = (nodeData.inputs?.replyToMessageId as string) || ''
        const replyToMessageId = rawReplyToId.replace(/<[^>]*>/g, '').trim()
        const disableWebPagePreview = nodeData.inputs?.disableWebPagePreview === true
        const continueOnFail = nodeData.inputs?.continueOnFail === true

        if (!chatId) {
            throw new Error('Telegram Chat ID is empty or invalid.')
        }

        if (!messageText) {
            throw new Error('Message Text is empty.')
        }

        const baseUrl = ((credentialData?.baseUrl as string) || 'https://api.telegram.org').replace(/\/+$/, '')
        const url = `${baseUrl}/bot${botToken}/sendMessage`

        const payload: Record<string, any> = {
            chat_id: chatId,
            text: messageText
        }

        if (parseMode && parseMode !== 'none') {
            payload.parse_mode = parseMode
        }

        if (replyToMessageId) {
            const parsedId = parseInt(replyToMessageId, 10)
            payload.reply_to_message_id = isNaN(parsedId) ? replyToMessageId : parsedId
        }

        if (disableWebPagePreview) {
            payload.disable_web_page_preview = true
        }

        let responseData: any = null
        let errorData: any = null

        try {
            const res = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            responseData = res.data
        } catch (error: any) {
            const tgError = error?.response?.data || error?.message
            errorData = {
                message: error?.message,
                details: tgError,
                url
            }

            if (!continueOnFail) {
                throw new Error(`Telegram API call failed: ${JSON.stringify(tgError)} | url=${url}`)
            }
        }

        const state = options.agentflowRuntime?.state as ICommonObject

        return {
            id: nodeData.id,
            name: this.name,
            input: {
                chatId,
                messageText,
                parseMode: parseMode !== 'none' ? parseMode : undefined,
                replyToMessageId: replyToMessageId || undefined
            },
            output: {
                success: !errorData,
                content: responseData ?? errorData
            },
            state
        }
    }
}

module.exports = { nodeClass: TelegramSend_Agentflow }
