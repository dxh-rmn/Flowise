import axios from 'axios'
import * as crypto from 'crypto'
import { getCredentialData } from '../../../src/utils'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class FacebookSend_Agentflow implements INode {
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
        this.label = 'Facebook Send'
        this.name = 'facebookSendAgentflow'
        this.version = 1.0
        this.type = 'FacebookSend'
        this.category = 'Agent Flows'
        this.description = 'Send a Messenger reply or publish a post to a Facebook Page via Meta Graph API'
        this.baseClasses = [this.type]
        this.color = '#1877F2'
        this.icon = 'facebook.svg'
        this.hideOutput = false
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['facebookPageApi'],
            optional: true
        }
        this.inputs = [
            {
                label: 'Action Type',
                name: 'actionType',
                type: 'options',
                options: [
                    {
                        label: 'Send Messenger Message',
                        name: 'sendMessengerMessage',
                        description: 'Send a direct reply to a Facebook Messenger user (using their PSID)'
                    },
                    {
                        label: 'Send Messenger Sender Action',
                        name: 'sendMessengerSenderAction',
                        description: 'Send typing indicator (typing_on/typing_off) or mark last message as read (mark_seen)'
                    },
                    {
                        label: 'Publish Page Post',
                        name: 'publishPagePost',
                        description: 'Publish a status update or post to the Facebook Page feed'
                    }
                ],
                default: 'sendMessengerMessage'
            },
            {
                label: 'Sender Action',
                name: 'senderAction',
                type: 'options',
                options: [
                    {
                        label: 'Typing Indicator On (typing_on)',
                        name: 'typing_on',
                        description: 'Display typing bubbles in Messenger for up to 20 seconds'
                    },
                    {
                        label: 'Mark as Seen (mark_seen)',
                        name: 'mark_seen',
                        description: 'Mark the recipient inbound message as read'
                    },
                    {
                        label: 'Typing Indicator Off (typing_off)',
                        name: 'typing_off',
                        description: 'Explicitly dismiss typing bubbles'
                    }
                ],
                default: 'typing_on',
                show: {
                    actionType: ['sendMessengerSenderAction']
                }
            },
            {
                label: 'Recipient PSID (Messenger)',
                name: 'recipientId',
                type: 'string',
                placeholder: 'e.g. {{ $webhook.body.entry[0].messaging[0].sender.id }}',
                description: 'The recipient Page-Scoped ID (PSID) from the inbound Messenger webhook.',
                default: '{{ $webhook.body.entry[0].messaging[0].sender.id }}',
                acceptVariable: true,
                show: {
                    actionType: ['sendMessengerMessage', 'sendMessengerSenderAction']
                }
            },
            {
                label: 'Page ID (Feed Post)',
                name: 'pageId',
                type: 'string',
                placeholder: 'e.g. 109876543210987 or {{ $node["start"].output }}',
                description: 'Facebook Page ID. Defaults to Page ID from credential if left blank.',
                optional: true,
                acceptVariable: true,
                show: {
                    actionType: ['publishPagePost']
                }
            },
            {
                label: 'Message Text',
                name: 'messageText',
                type: 'string',
                rows: 4,
                placeholder: 'Type message or select dynamic output from previous agent node',
                description: 'Text content to send in Messenger or publish on the Page feed.',
                acceptVariable: true,
                show: {
                    actionType: ['sendMessengerMessage', 'publishPagePost']
                }
            },
            {
                label: 'Simulate Typing Before Sending',
                name: 'simulateTyping',
                type: 'boolean',
                description: 'If enabled, shows typing indicators in Messenger for a brief moment before dispatching the message.',
                optional: true,
                default: false,
                show: {
                    actionType: ['sendMessengerMessage']
                }
            },
            {
                label: 'Typing Duration (seconds)',
                name: 'typingDelay',
                type: 'number',
                description: 'Duration to display the typing indicator before sending the message (default: 1 second).',
                optional: true,
                default: 1,
                show: {
                    actionType: ['sendMessengerMessage'],
                    simulateTyping: [true]
                }
            },
            {
                label: 'Link URL',
                name: 'linkUrl',
                type: 'string',
                placeholder: 'e.g. https://yourdomain.com/blog/article-1',
                description: 'Optional URL to attach to the Facebook Page post.',
                optional: true,
                acceptVariable: true,
                show: {
                    actionType: ['publishPagePost']
                }
            },
            {
                label: 'Continue on Fail',
                name: 'continueOnFail',
                type: 'boolean',
                description:
                    'If enabled, the flow will not terminate if Meta Graph API returns an error, but return the error in output instead.',
                optional: true,
                default: false
            }
        ]
    }

    async run(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData((nodeData.credential as string) ?? '', options)

        // Dynamic OAuth token resolution (supports multi-tenant user tokens passed via overrideConfig.vars)
        const dynamicToken =
            (options.overrideConfig?.vars?.userFacebookToken as string) ||
            (options.overrideConfig?.vars?.facebookAccessToken as string) ||
            (options.overrideConfig?.vars?.userFacebookPageToken as string)

        const accessToken = dynamicToken || (credentialData?.accessToken as string)

        if (!accessToken) {
            throw new Error('Facebook Page Access Token is missing in credential or dynamic overrideConfig.')
        }

        const appSecret =
            (credentialData?.appSecret as string) ||
            (options.overrideConfig?.vars?.facebookAppSecret as string) ||
            (options.overrideConfig?.vars?.appSecret as string)

        const params: Record<string, string> = {}
        if (appSecret) {
            params.appsecret_proof = crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex')
        }

        const actionType = (nodeData.inputs?.actionType as string) || 'sendMessengerMessage'
        const continueOnFail = nodeData.inputs?.continueOnFail === true

        let url = ''
        let payload: any = {}

        if (actionType === 'sendMessengerSenderAction') {
            const rawRecipient = (nodeData.inputs?.recipientId as string) || ''
            const recipient = rawRecipient.replace(/<[^>]*>/g, '').trim()

            if (!recipient) {
                throw new Error('Recipient PSID is empty or invalid.')
            }

            const senderAction = (nodeData.inputs?.senderAction as string) || 'typing_on'
            url = 'https://graph.facebook.com/v20.0/me/messages'
            payload = {
                recipient: { id: recipient },
                sender_action: senderAction
            }
        } else if (actionType === 'sendMessengerMessage') {
            const rawRecipient = (nodeData.inputs?.recipientId as string) || ''
            const recipient = rawRecipient.replace(/<[^>]*>/g, '').trim()
            const messageText = (nodeData.inputs?.messageText as string) || ''

            if (!recipient) {
                throw new Error('Recipient PSID is empty or invalid.')
            }

            if (!messageText) {
                throw new Error('Message Text is empty.')
            }

            url = 'https://graph.facebook.com/v20.0/me/messages'

            const simulateTyping = nodeData.inputs?.simulateTyping === true
            const typingDelay = Number(nodeData.inputs?.typingDelay ?? 1)

            if (simulateTyping) {
                try {
                    await axios.post(
                        url,
                        {
                            recipient: { id: recipient },
                            sender_action: 'typing_on'
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            params
                        }
                    )
                    if (typingDelay > 0) {
                        await new Promise((resolve) => setTimeout(resolve, Math.min(typingDelay, 10) * 1000))
                    }
                } catch (error) {
                    // Non-fatal if typing indicator fails; proceed to send message
                }
            }

            payload = {
                recipient: { id: recipient },
                messaging_type: 'RESPONSE',
                message: {
                    text: messageText
                }
            }
        } else if (actionType === 'publishPagePost') {
            const messageText = (nodeData.inputs?.messageText as string) || ''
            if (!messageText) {
                throw new Error('Message Text is empty.')
            }

            const pageId = (nodeData.inputs?.pageId as string) || (credentialData?.pageId as string) || 'me'
            const linkUrl = (nodeData.inputs?.linkUrl as string) || undefined

            url = `https://graph.facebook.com/v20.0/${pageId}/feed`
            payload = {
                message: messageText,
                ...(linkUrl ? { link: linkUrl } : {})
            }
        } else {
            throw new Error(`Unsupported Facebook action type: ${actionType}`)
        }

        let responseData: any = null
        let errorData: any = null

        try {
            const res = await axios.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                params
            })
            responseData = res.data
        } catch (error: any) {
            const graphError = error?.response?.data?.error || error?.response?.data || error?.message
            errorData = {
                message: error?.message,
                details: graphError,
                url,
                actionType
            }

            if (!continueOnFail) {
                throw new Error(`Facebook API call failed: ${JSON.stringify(graphError)} | url=${url}`)
            }
        }

        const state = options.agentflowRuntime?.state as ICommonObject

        return {
            id: nodeData.id,
            name: this.name,
            input: {
                actionType,
                payload
            },
            output: {
                success: !errorData,
                content: responseData ?? errorData
            },
            state
        }
    }
}

module.exports = { nodeClass: FacebookSend_Agentflow }
