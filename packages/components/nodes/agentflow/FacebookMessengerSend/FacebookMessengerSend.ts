import axios from 'axios'
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
        this.description = 'Send a direct message reply to a Facebook Messenger recipient via Meta Graph API'
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
                acceptVariable: true
            },
            {
                label: 'Continue on Fail',
                name: 'continueOnFail',
                type: 'boolean',
                description: 'If enabled, the flow will not terminate if Meta Graph API returns an error, but return the error in output instead.',
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

        const rawRecipient = (nodeData.inputs?.recipientId as string) || ''
        const recipient = rawRecipient.replace(/<[^>]*>/g, '').trim()
        const messageText = (nodeData.inputs?.messageText as string) || ''
        const continueOnFail = nodeData.inputs?.continueOnFail === true

        if (!recipient) {
            throw new Error('Recipient PSID is empty or invalid.')
        }

        if (!messageText) {
            throw new Error('Message Text is empty.')
        }

        const url = 'https://graph.facebook.com/v20.0/me/messages'
        const payload = {
            recipient: { id: recipient },
            messaging_type: 'RESPONSE',
            message: {
                text: messageText
            }
        }

        let responseData: any = null
        let errorData: any = null

        try {
            const res = await axios.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
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
