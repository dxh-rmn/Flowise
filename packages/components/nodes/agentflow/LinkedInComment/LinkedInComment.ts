import axios from 'axios'
import { getCredentialData } from '../../../src/utils'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class LinkedInComment_Agentflow implements INode {
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
        this.label = 'LinkedIn Comment'
        this.name = 'linkedInCommentAgentflow'
        this.version = 1.0
        this.type = 'LinkedInComment'
        this.category = 'Agent Flows'
        this.description =
            'Post a comment or reply to an existing comment on a LinkedIn post on behalf of an Organization Page or Personal Profile'
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
                label: 'Actor Type',
                name: 'actorType',
                type: 'options',
                options: [
                    {
                        label: 'Company / Organization Page',
                        name: 'organization',
                        description: 'Comment on behalf of your LinkedIn Company / Organization Page'
                    },
                    {
                        label: 'Personal Profile',
                        name: 'person',
                        description: 'Comment on behalf of your personal LinkedIn profile'
                    }
                ],
                default: 'organization',
                description: 'Post the comment as a Company/Organization Page or an individual profile.',
                optional: true
            },
            {
                label: 'Organization ID',
                name: 'organizationId',
                type: 'string',
                placeholder: 'e.g. 12345678 or leave blank to use from credential',
                description: 'Numeric Organization / Company Page ID. Required when commenting as an Organization.',
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
                label: 'Target Post URN / URL',
                name: 'targetPostUrn',
                type: 'string',
                placeholder: 'e.g. {{ $webhook.body.entity }} or urn:li:share:12345678',
                default: '{{ $webhook.body.entity }}',
                description: 'The URN or URL of the LinkedIn post to comment on. Defaults to incoming post URN from webhook.',
                acceptVariable: true
            },
            {
                label: 'Comment Type',
                name: 'commentType',
                type: 'options',
                options: [
                    {
                        label: 'Reply to an Existing Comment',
                        name: 'reply',
                        description: 'Reply in a thread to an existing user comment'
                    },
                    {
                        label: 'Top-Level Comment on Post',
                        name: 'comment',
                        description: 'Post a new comment directly on the post'
                    }
                ],
                default: 'reply',
                description: 'Choose whether to reply to an incoming comment or post a top-level comment.',
                optional: true
            },
            {
                label: 'Parent Comment URN',
                name: 'parentCommentUrn',
                type: 'string',
                placeholder: 'e.g. {{ $webhook.body.comment }} or urn:li:comment:(urn:li:share:12345678,987654321)',
                default: '{{ $webhook.body.comment }}',
                description:
                    'The URN of the comment to reply to (required when Comment Type is "Reply to an Existing Comment"). Defaults to incoming comment from webhook.',
                optional: true,
                acceptVariable: true
            },
            {
                label: 'Comment Text',
                name: 'messageText',
                type: 'string',
                rows: 4,
                placeholder: 'Type comment content or select dynamic output from previous agent node',
                description: 'The text content of your comment or reply.',
                acceptVariable: true
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

        // Dynamic OAuth token resolution
        const dynamicToken =
            (options.overrideConfig?.vars?.userLinkedInToken as string) || (options.overrideConfig?.vars?.linkedInAccessToken as string)

        const accessToken = dynamicToken || (credentialData?.accessToken as string)

        if (!accessToken) {
            throw new Error('LinkedIn Access Token is missing in credential or dynamic overrideConfig.')
        }

        const messageText = (nodeData.inputs?.messageText as string) || ''
        if (!messageText.trim()) {
            throw new Error('Comment Text is empty.')
        }

        // Validate and normalize Target Post URN
        const rawTarget =
            (nodeData.inputs?.targetPostUrn as string) || (options.overrideConfig?.vars?.userLinkedInTargetPostUrn as string) || ''
        const cleanTarget = rawTarget.trim()
        if (!cleanTarget) {
            throw new Error('Target Post URN is required.')
        }

        let targetUrn = cleanTarget
        const urnMatch = cleanTarget.match(/urn:li:(?:share|ugcPost|activity):[0-9]+/i)
        if (urnMatch) {
            targetUrn = urnMatch[0]
        } else if (/^\d+$/.test(cleanTarget)) {
            targetUrn = `urn:li:share:${cleanTarget}`
        }

        const actorType = (nodeData.inputs?.actorType as string) || (credentialData?.authorType as string) || 'organization'

        let actorUrn = ''

        if (actorType === 'organization') {
            const rawOrgId =
                (nodeData.inputs?.organizationId as string) ||
                (credentialData?.organizationId as string) ||
                (options.overrideConfig?.vars?.userLinkedInOrganizationId as string) ||
                ''
            const cleanOrgId = rawOrgId.trim()
            if (!cleanOrgId) {
                throw new Error('LinkedIn Organization ID is required when commenting on behalf of a Company / Organization Page.')
            }
            actorUrn = cleanOrgId.startsWith('urn:li:') ? cleanOrgId : `urn:li:organization:${cleanOrgId.replace(/[^0-9]/g, '')}`
        } else {
            const rawPersonUrn =
                (nodeData.inputs?.personUrn as string) ||
                (credentialData?.personUrn as string) ||
                (options.overrideConfig?.vars?.userLinkedInAuthorUrn as string) ||
                ''
            const cleanPersonUrn = rawPersonUrn.trim()
            if (cleanPersonUrn) {
                actorUrn = cleanPersonUrn.startsWith('urn:li:') ? cleanPersonUrn : `urn:li:person:${cleanPersonUrn}`
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
                    actorUrn = `urn:li:person:${sub}`
                } catch (userinfoErr: any) {
                    const errMsg = userinfoErr?.response?.data?.message || userinfoErr?.message
                    throw new Error(
                        `Failed to auto-detect LinkedIn Person URN via /v2/userinfo: ${errMsg}. Please provide Person URN explicitly.`
                    )
                }
            }
        }

        const commentType = (nodeData.inputs?.commentType as string) || 'comment'
        const continueOnFail = nodeData.inputs?.continueOnFail === true

        const payload: any = {
            actor: actorUrn,
            message: {
                text: messageText
            }
        }

        if (commentType === 'reply') {
            const parentCommentUrn = ((nodeData.inputs?.parentCommentUrn as string) || '').trim()
            if (!parentCommentUrn) {
                throw new Error('Parent Comment URN is required when replying to an existing comment.')
            }
            payload.parentComment = parentCommentUrn
        }

        const encodedTarget = encodeURIComponent(targetUrn)
        const url = `https://api.linkedin.com/rest/socialActions/${encodedTarget}/comments`

        let responseData: any = null
        let errorData: any = null
        let commentId: string | null = null

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
            commentId = (res.headers?.['x-restli-id'] as string) || (res.headers?.['x-linkedin-id'] as string) || res.data?.id || null
        } catch (error: any) {
            const liError = error?.response?.data || error?.message
            errorData = {
                message: error?.message,
                details: liError,
                status: error?.response?.status,
                url
            }

            if (!continueOnFail) {
                throw new Error(`LinkedIn Comment API call failed: ${JSON.stringify(liError)} | url=${url}`)
            }
        }

        const state = options.agentflowRuntime?.state as ICommonObject

        return {
            id: nodeData.id,
            name: this.name,
            input: {
                actor: actorUrn,
                targetUrn,
                commentType,
                payload
            },
            output: {
                success: !errorData,
                commentId,
                content: responseData ?? errorData
            },
            state
        }
    }
}

module.exports = { nodeClass: LinkedInComment_Agentflow }
