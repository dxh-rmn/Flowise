import axios from 'axios'
import { getCredentialData } from '../../../src/utils'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class WhatsAppSend_Agentflow implements INode {
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
        this.label = 'WhatsApp Send'
        this.name = 'whatsAppSendAgentflow'
        this.version = 1.0
        this.type = 'WhatsAppSend'
        this.category = 'Agent Flows'
        this.description = 'Send a text reply to a WhatsApp recipient via Meta WhatsApp Business Cloud API'
        this.baseClasses = [this.type]
        this.color = '#25D366'
        this.icon = 'whatsapp.svg'
        this.hideOutput = false
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['whatsAppCloudApi']
        }
        this.inputs = [
            {
                label: 'Recipient Phone Number',
                name: 'recipientPhoneNumber',
                type: 'string',
                placeholder: 'e.g. {{ $webhook.body.entry[0].changes[0].value.messages[0].from }}',
                description: 'Recipient phone number (with country code, digits only). Defaults to incoming WhatsApp sender from webhook.',
                default: '{{ $webhook.body.entry[0].changes[0].value.messages[0].from }}',
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
            }
        ]
    }

    async run(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData((nodeData.credential as string) ?? '', options)
        const accessToken = credentialData?.accessToken as string
        const phoneNumberId = credentialData?.phoneNumberId as string

        if (!accessToken) {
            throw new Error('WhatsApp Cloud API Access Token is missing in credential.')
        }
        if (!phoneNumberId) {
            throw new Error('WhatsApp Phone Number ID is missing in credential.')
        }

        let recipient = (nodeData.inputs?.recipientPhoneNumber as string) || ''
        const messageText = (nodeData.inputs?.messageText as string) || ''

        // Clean phone number (remove leading +, spaces, hyphens)
        recipient = recipient.replace(/[^\d]/g, '')

        if (!recipient) {
            throw new Error('Recipient Phone Number is empty or invalid.')
        }

        if (!messageText) {
            throw new Error('Message Text is empty.')
        }

        const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipient,
            type: 'text',
            text: {
                body: messageText
            }
        }

        let response: any
        try {
            response = await axios.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            })
        } catch (error: any) {
            throw new Error(
                `WhatsApp send failed: ${
                    JSON.stringify(error?.response?.data) || error?.message
                } | url=${url} to=${recipient} msg=${messageText}`
            )
        }

        const state = options.agentflowRuntime?.state as ICommonObject

        return {
            id: nodeData.id,
            name: this.name,
            input: {
                to: recipient,
                message: messageText
            },
            output: {
                content: response.data
            },
            state
        }
    }
}

module.exports = { nodeClass: WhatsAppSend_Agentflow }
