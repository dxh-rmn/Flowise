import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('../../../src/utils', () => ({
    getCredentialData: jest.fn().mockResolvedValue({
        accessToken: 'mock-linkedin-access-token',
        authorType: 'organization',
        organizationId: '99887766'
    })
}))

const { nodeClass } = require('./LinkedInPost')

describe('LinkedInPost Node', () => {
    let node: any

    beforeEach(() => {
        node = new nodeClass()
        jest.clearAllMocks()
    })

    it('should have correct node metadata', () => {
        expect(node.label).toBe('LinkedIn Post')
        expect(node.name).toBe('linkedInPostAgentflow')
        expect(node.type).toBe('LinkedInPost')
        expect(node.category).toBe('Agent Flows')
        expect(node.color).toBe('#0A66C2')
        expect(node.icon).toBe('linkedin.svg')
    })

    it('should publish post to Company / Organization Page feed', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: { id: 'urn:li:share:7123456789' },
            headers: { 'x-restli-id': 'urn:li:share:7123456789' }
        })

        const nodeData = {
            id: 'linkedInPost_0',
            inputs: {
                targetType: 'organization',
                organizationId: '99887766',
                messageText: 'Excited to announce our new AI Workflow Automation platform!',
                visibility: 'PUBLIC'
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.linkedin.com/rest/posts',
            {
                author: 'urn:li:organization:99887766',
                commentary: 'Excited to announce our new AI Workflow Automation platform!',
                visibility: 'PUBLIC',
                distribution: {
                    feedDistribution: 'MAIN_FEED',
                    targetEntities: [],
                    thirdPartyDistributionChannels: []
                },
                lifecycleState: 'PUBLISHED',
                isReshareDisabledByAuthor: false
            },
            {
                headers: {
                    Authorization: 'Bearer mock-linkedin-access-token',
                    'Content-Type': 'application/json',
                    'LinkedIn-Version': '202401',
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            }
        )

        expect(result.output.success).toBe(true)
        expect(result.output.postId).toBe('urn:li:share:7123456789')
    })

    it('should publish article link card preview on Organization Page', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {},
            headers: { 'x-restli-id': 'urn:li:share:7123456789' }
        })

        const nodeData = {
            id: 'linkedInPost_0',
            inputs: {
                targetType: 'organization',
                organizationId: 'urn:li:organization:99887766',
                messageText: 'Check out our latest architectural engineering report:',
                linkUrl: 'https://devxhub.com/blog/ai-agent-architecture',
                linkTitle: 'AI Agent Architecture 2026',
                linkDescription: 'A deep dive into multi-agent orchestration',
                visibility: 'PUBLIC'
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.linkedin.com/rest/posts',
            expect.objectContaining({
                author: 'urn:li:organization:99887766',
                commentary: 'Check out our latest architectural engineering report:',
                content: {
                    article: {
                        source: 'https://devxhub.com/blog/ai-agent-architecture',
                        title: 'AI Agent Architecture 2026',
                        description: 'A deep dive into multi-agent orchestration'
                    }
                }
            }),
            expect.any(Object)
        )

        expect(result.output.success).toBe(true)
        expect(result.output.postId).toBe('urn:li:share:7123456789')
    })

    it('should auto-resolve person URN via /v2/userinfo when posting to Personal Profile', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { sub: 'person_sub_abc123', name: 'John Doe' }
        })
        mockedAxios.post.mockResolvedValueOnce({
            data: {},
            headers: { 'x-restli-id': 'urn:li:share:88776655' }
        })

        const nodeData = {
            id: 'linkedInPost_0',
            inputs: {
                targetType: 'person',
                messageText: 'Personal thought of the day on generative workflows.'
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.get).toHaveBeenCalledWith('https://api.linkedin.com/v2/userinfo', {
            headers: {
                Authorization: 'Bearer mock-linkedin-access-token'
            }
        })

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.linkedin.com/rest/posts',
            expect.objectContaining({
                author: 'urn:li:person:person_sub_abc123',
                commentary: 'Personal thought of the day on generative workflows.'
            }),
            expect.any(Object)
        )

        expect(result.output.success).toBe(true)
        expect(result.output.postId).toBe('urn:li:share:88776655')
    })

    it('should throw error when message text is empty', async () => {
        const nodeData = {
            id: 'linkedInPost_0',
            inputs: {
                targetType: 'organization',
                organizationId: '99887766',
                messageText: '   '
            }
        }

        await expect(node.run(nodeData, '', {})).rejects.toThrow('Post Content is empty.')
    })

    it('should throw error when organization ID is missing for organization post', async () => {
        const { getCredentialData } = require('../../../src/utils')
        getCredentialData.mockResolvedValueOnce({
            accessToken: 'mock-linkedin-access-token',
            authorType: 'organization',
            organizationId: ''
        })

        const nodeData = {
            id: 'linkedInPost_0',
            inputs: {
                targetType: 'organization',
                organizationId: '',
                messageText: 'Testing organization validation'
            }
        }

        await expect(node.run(nodeData, '', {})).rejects.toThrow(
            'LinkedIn Organization ID is required when posting to a Company / Organization Page.'
        )
    })

    it('should handle continueOnFail gracefully when API returns error', async () => {
        mockedAxios.post.mockRejectedValueOnce({
            message: 'Request failed with status code 403',
            response: {
                status: 403,
                data: { message: 'Not enough permissions to access /rest/posts' }
            }
        })

        const nodeData = {
            id: 'linkedInPost_0',
            inputs: {
                targetType: 'organization',
                organizationId: '99887766',
                messageText: 'Failed post attempt',
                continueOnFail: true
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(result.output.success).toBe(false)
        expect(result.output.content.status).toBe(403)
        expect(result.output.content.details).toEqual({ message: 'Not enough permissions to access /rest/posts' })
    })
})
