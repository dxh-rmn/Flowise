import axios from 'axios'
import { getCredentialData } from '../../../src/utils'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class FacebookPagePost_Agentflow implements INode {
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
        this.label = 'Facebook Page Post'
        this.name = 'facebookPagePostAgentflow'
        this.version = 1.0
        this.type = 'FacebookPagePost'
        this.category = 'Agent Flows'
        this.description = 'Publish a status update, post, or link to a Facebook Page feed via Meta Graph API'
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
                label: 'Page ID',
                name: 'pageId',
                type: 'string',
                placeholder: 'e.g. 109876543210987 or leave blank to use Page ID from credential/me',
                description: 'Facebook Page ID. Defaults to Page ID from credential or "me" if left blank.',
                optional: true,
                acceptVariable: true
            },
            {
                label: 'Post Content',
                name: 'messageText',
                type: 'string',
                rows: 4,
                placeholder: 'Type post content or select dynamic output from previous agent node',
                description: 'Text message or update to publish on the Facebook Page feed.',
                acceptVariable: true
            },
            {
                label: 'Link URL',
                name: 'linkUrl',
                type: 'string',
                placeholder: 'e.g. https://yourdomain.com/blog/article-1',
                description: 'Optional URL link to attach to the Facebook Page post.',
                optional: true,
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

        const pageId = (nodeData.inputs?.pageId as string) || (credentialData?.pageId as string) || 'me'
        const messageText = (nodeData.inputs?.messageText as string) || ''
        const linkUrl = (nodeData.inputs?.linkUrl as string) || undefined
        const continueOnFail = nodeData.inputs?.continueOnFail === true

        if (!messageText) {
            throw new Error('Post Content is empty.')
        }

        const url = `https://graph.facebook.com/v20.0/${pageId}/feed`
        const payload: any = {
            message: messageText,
            ...(linkUrl ? { link: linkUrl } : {})
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
                throw new Error(`Facebook Page Post API call failed: ${JSON.stringify(graphError)} | url=${url}`)
            }
        }

        const state = options.agentflowRuntime?.state as ICommonObject

        return {
            id: nodeData.id,
            name: this.name,
            input: {
                pageId,
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

module.exports = { nodeClass: FacebookPagePost_Agentflow }
