import axios from 'axios'
import { getCredentialData } from '../../../src/utils'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class LinkedInPost_Agentflow implements INode {
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
        this.label = 'LinkedIn Post'
        this.name = 'linkedInPostAgentflow'
        this.version = 1.0
        this.type = 'LinkedInPost'
        this.category = 'Agent Flows'
        this.description =
            'Publish a status update, article link, or thought-leadership post to a LinkedIn Company Page or Personal Profile'
        this.baseClasses = [this.type]
        this.color = '#0A66C2'
        this.icon = 'linkedin.svg'
        this.hideOutput = false
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['linkedInApi'],
            optional: true
        }
        this.inputs = [
            {
                label: 'Target Type',
                name: 'targetType',
                type: 'options',
                options: [
                    {
                        label: 'Company / Organization Page',
                        name: 'organization',
                        description: 'Publish updates on behalf of a LinkedIn Company / Organization Page'
                    },
                    {
                        label: 'Personal Profile',
                        name: 'person',
                        description: 'Publish updates on behalf of an individual LinkedIn Member profile'
                    }
                ],
                default: 'organization',
                description: 'Publish to a LinkedIn Company/Organization Page or an individual Personal Profile.',
                optional: true
            },
            {
                label: 'Organization ID',
                name: 'organizationId',
                type: 'string',
                placeholder: 'e.g. 12345678 or leave blank to use from credential',
                description: 'Numeric Organization / Company Page ID. Required when publishing to an Organization Page.',
                optional: true,
                acceptVariable: true
            },
            {
                label: 'Person URN / Member ID',
                name: 'personUrn',
                type: 'string',
                placeholder: 'e.g. urn:li:person:abcdef or leave blank to auto-detect',
                description: 'Optional personal Member URN. If left blank, Flowise will auto-resolve it via /v2/userinfo.',
                optional: true,
                acceptVariable: true
            },
            {
                label: 'Post Content',
                name: 'messageText',
                type: 'string',
                rows: 4,
                placeholder: 'Type post commentary or select dynamic output from previous agent node',
                description: 'Text commentary or article text to publish on LinkedIn.',
                acceptVariable: true
            },
            {
                label: 'Article / Link URL',
                name: 'linkUrl',
                type: 'string',
                placeholder: 'e.g. https://yourcompany.com/blog/announcement',
                description: 'Optional URL link to attach as an article preview card to the post.',
                optional: true,
                acceptVariable: true
            },
            {
                label: 'Link Title',
                name: 'linkTitle',
                type: 'string',
                placeholder: 'e.g. Introducing Our New AI Agent Architecture',
                description: 'Optional custom title override for the article preview card.',
                optional: true,
                acceptVariable: true
            },
            {
                label: 'Link Description',
                name: 'linkDescription',
                type: 'string',
                placeholder: 'e.g. Read how we built high-performance workflow automation.',
                description: 'Optional custom description override for the article preview card.',
                optional: true,
                acceptVariable: true
            },
            {
                label: 'Visibility',
                name: 'visibility',
                type: 'options',
                options: [
                    {
                        label: 'Public (Anyone on LinkedIn)',
                        name: 'PUBLIC'
                    },
                    {
                        label: 'Connections Only',
                        name: 'CONNECTIONS'
                    }
                ],
                default: 'PUBLIC',
                description: 'Visibility of the post on LinkedIn.',
                optional: true
            },
            {
                label: 'Continue on Fail',
                name: 'continueOnFail',
                type: 'boolean',
                description:
                    'If enabled, the flow will not abort if the LinkedIn API returns an error, but return the error in output instead.',
                optional: true,
                default: false
            }
        ]
    }

    async run(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData((nodeData.credential as string) ?? '', options)

        // Dynamic OAuth token resolution (supports multi-tenant user tokens passed via overrideConfig.vars)
        const dynamicToken =
            (options.overrideConfig?.vars?.userLinkedInToken as string) || (options.overrideConfig?.vars?.linkedInAccessToken as string)

        const accessToken = dynamicToken || (credentialData?.accessToken as string)

        if (!accessToken) {
            throw new Error('LinkedIn Access Token is missing in credential or dynamic overrideConfig.')
        }

        const targetType = (nodeData.inputs?.targetType as string) || (credentialData?.authorType as string) || 'organization'

        const messageText = (nodeData.inputs?.messageText as string) || ''
        if (!messageText.trim()) {
            throw new Error('Post Content is empty.')
        }

        let authorUrn = ''

        if (targetType === 'organization') {
            const rawOrgId =
                (nodeData.inputs?.organizationId as string) ||
                (credentialData?.organizationId as string) ||
                (options.overrideConfig?.vars?.userLinkedInOrganizationId as string) ||
                ''
            const cleanOrgId = rawOrgId.trim()
            if (!cleanOrgId) {
                throw new Error('LinkedIn Organization ID is required when posting to a Company / Organization Page.')
            }
            authorUrn = cleanOrgId.startsWith('urn:li:') ? cleanOrgId : `urn:li:organization:${cleanOrgId.replace(/[^0-9]/g, '')}`
        } else {
            const rawPersonUrn =
                (nodeData.inputs?.personUrn as string) ||
                (credentialData?.personUrn as string) ||
                (options.overrideConfig?.vars?.userLinkedInAuthorUrn as string) ||
                ''
            const cleanPersonUrn = rawPersonUrn.trim()
            if (cleanPersonUrn) {
                authorUrn = cleanPersonUrn.startsWith('urn:li:') ? cleanPersonUrn : `urn:li:person:${cleanPersonUrn}`
            } else {
                // Auto-resolve personal sub from /v2/userinfo
                try {
                    const userinfoRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    })
                    const sub = userinfoRes.data?.sub
                    if (!sub) {
                        throw new Error('Could not retrieve user sub from LinkedIn /v2/userinfo.')
                    }
                    authorUrn = `urn:li:person:${sub}`
                } catch (userinfoErr: any) {
                    const errMsg = userinfoErr?.response?.data?.message || userinfoErr?.message
                    throw new Error(
                        `Failed to auto-detect LinkedIn Person URN via /v2/userinfo: ${errMsg}. Please provide Person URN explicitly.`
                    )
                }
            }
        }

        const linkUrl = (nodeData.inputs?.linkUrl as string) || undefined
        const linkTitle = (nodeData.inputs?.linkTitle as string) || undefined
        const linkDescription = (nodeData.inputs?.linkDescription as string) || undefined
        const visibility = (nodeData.inputs?.visibility as string) || 'PUBLIC'
        const continueOnFail = nodeData.inputs?.continueOnFail === true

        const payload: any = {
            author: authorUrn,
            commentary: messageText,
            visibility,
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: []
            },
            lifecycleState: 'PUBLISHED',
            isReshareDisabledByAuthor: false
        }

        if (linkUrl) {
            payload.content = {
                article: {
                    source: linkUrl,
                    ...(linkTitle ? { title: linkTitle } : {}),
                    ...(linkDescription ? { description: linkDescription } : {})
                }
            }
        }

        const url = 'https://api.linkedin.com/rest/posts'
        let responseData: any = null
        let errorData: any = null
        let postId: string | null = null

        try {
            const res = await axios.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'LinkedIn-Version': '202401',
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            })
            responseData = res.data
            postId = (res.headers?.['x-restli-id'] as string) || (res.headers?.['x-linkedin-id'] as string) || res.data?.id || null
        } catch (error: any) {
            const liError = error?.response?.data || error?.message
            errorData = {
                message: error?.message,
                details: liError,
                status: error?.response?.status,
                url
            }

            if (!continueOnFail) {
                throw new Error(`LinkedIn Post API call failed: ${JSON.stringify(liError)} | url=${url}`)
            }
        }

        const state = options.agentflowRuntime?.state as ICommonObject

        return {
            id: nodeData.id,
            name: this.name,
            input: {
                targetType,
                author: authorUrn,
                payload
            },
            output: {
                success: !errorData,
                postId,
                content: responseData ?? errorData
            },
            state
        }
    }
}

module.exports = { nodeClass: LinkedInPost_Agentflow }
