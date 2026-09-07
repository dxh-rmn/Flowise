import axios from 'axios'
import * as crypto from 'crypto'
import { getCredentialData } from '../../../src/utils'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class FacebookMessengerSend_Agentflow implements INode {
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
        this.label = 'Facebook Messenger Send'
        this.name = 'facebookMessengerSendAgentflow'
        this.version = 1.0
        this.type = 'FacebookMessengerSend'
        this.category = 'Agent Flows'
        this.description = 'Send a direct message reply or typing indicator to a Facebook Messenger recipient via Meta Graph API'
        this.baseClasses = [this.type]
        this.color = '#0084FF'
        this.icon = 'messenger.svg'
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
                        label: 'Send Text Message',
                        name: 'sendTextMessage',
                        description: 'Send a direct text message reply to the recipient'
                    },
                    {
                        label: 'Sender Action (Typing Indicator / Mark Seen)',
                        name: 'sendSenderAction',
                        description: 'Send typing indicator (typing_on/typing_off) or mark last message as read (mark_seen)'
                    }
                ],
                default: 'sendTextMessage'
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
                    actionType: ['sendSenderAction']
                }
            },
            {
                label: 'Recipient PSID',
                name: 'recipientId',
                type: 'string',
                placeholder: 'e.g. {{ $webhook.body.entry[0].messaging[0].sender.id }}',
                description: 'The recipient Page-Scoped ID (PSID) from the inbound Messenger webhook.',
                default: '{{ $webhook.body.entry[0].messaging[0].sender.id }}',
                acceptVariable: true
            },
            {
                label: 'Message Text',
                name: 'messageText',
                type: 'string',
                rows: 4,
                placeholder: 'Type message or select dynamic output from previous agent node',
                description: 'Text message content to send in Messenger.',
                acceptVariable: true,
                show: {
                    actionType: ['sendTextMessage']
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
                    actionType: ['sendTextMessage']
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
                    actionType: ['sendTextMessage'],
                    simulateTyping: [true]
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

        const actionType = (nodeData.inputs?.actionType as string) || 'sendTextMessage'
        const rawRecipient = (nodeData.inputs?.recipientId as string) || ''
        const recipient = rawRecipient.replace(/<[^>]*>/g, '').trim()
        const continueOnFail = nodeData.inputs?.continueOnFail === true

        if (!recipient) {
            throw new Error('Recipient PSID is empty or invalid.')
        }

        const url = 'https://graph.facebook.com/v20.0/me/messages'
        let responseData: any = null
        let errorData: any = null

        if (actionType === 'sendSenderAction') {
            const senderAction = (nodeData.inputs?.senderAction as string) || 'typing_on'
            const payload = {
                recipient: { id: recipient },
                sender_action: senderAction
            }

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
                    url
                }

                if (!continueOnFail) {
                    throw new Error(`Facebook Messenger API call failed: ${JSON.stringify(graphError)} | url=${url}`)
                }
            }

            const state = options.agentflowRuntime?.state as ICommonObject

            return {
                id: nodeData.id,
                name: this.name,
                input: {
                    actionType,
                    senderAction,
                    recipientId: recipient
                },
                output: {
                    success: !errorData,
                    content: responseData ?? errorData
                },
                state
            }
        }

        // Action: sendTextMessage
        const messageText = (nodeData.inputs?.messageText as string) || ''
        if (!messageText) {
            throw new Error('Message Text is empty.')
        }

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

        const payload = {
            recipient: { id: recipient },
            messaging_type: 'RESPONSE',
            message: {
                text: messageText
            }
        }

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
                url
            }

            if (!continueOnFail) {
                throw new Error(`Facebook Messenger API call failed: ${JSON.stringify(graphError)} | url=${url}`)
            }
        }

        const state = options.agentflowRuntime?.state as ICommonObject

        return {
            id: nodeData.id,
            name: this.name,
            input: {
                actionType,
                recipientId: recipient,
                messageText
            },
            output: {
                success: !errorData,
                content: responseData ?? errorData
            },
            state
        }
    }
}

module.exports = { nodeClass: FacebookMessengerSend_Agentflow }
