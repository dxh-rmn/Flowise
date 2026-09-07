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

const { nodeClass } = require('./LinkedInComment')

describe('LinkedInComment Node', () => {
    let node: any

    beforeEach(() => {
        node = new nodeClass()
        jest.clearAllMocks()
    })

    it('should have correct node metadata', () => {
        expect(node.label).toBe('LinkedIn Comment')
        expect(node.name).toBe('linkedInCommentAgentflow')
        expect(node.type).toBe('LinkedInComment')
        expect(node.category).toBe('Agent Flows')
        expect(node.color).toBe('#0A66C2')
        expect(node.icon).toBe('linkedin.svg')
    })

    it('should post top-level comment on behalf of an Organization', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: { id: 'urn:li:comment:(urn:li:share:7123456789,1001)' },
            headers: { 'x-restli-id': 'urn:li:comment:(urn:li:share:7123456789,1001)' }
        })

        const nodeData = {
            id: 'linkedInComment_0',
            inputs: {
                actorType: 'organization',
                organizationId: '99887766',
                targetPostUrn: 'urn:li:share:7123456789',
                commentType: 'comment',
                messageText: 'Great insights! Thanks for sharing.'
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.linkedin.com/rest/socialActions/urn%3Ali%3Ashare%3A7123456789/comments',
            {
                actor: 'urn:li:organization:99887766',
                message: {
                    text: 'Great insights! Thanks for sharing.'
                }
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
        expect(result.output.commentId).toBe('urn:li:comment:(urn:li:share:7123456789,1001)')
    })

    it('should reply to an existing comment (threaded reply)', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {},
            headers: { 'x-restli-id': 'urn:li:comment:(urn:li:share:7123456789,2002)' }
        })

        const nodeData = {
            id: 'linkedInComment_0',
            inputs: {
                actorType: 'organization',
                organizationId: 'urn:li:organization:99887766',
                targetPostUrn: 'urn:li:share:7123456789',
                commentType: 'reply',
                parentCommentUrn: 'urn:li:comment:(urn:li:share:7123456789,1001)',
                messageText: 'We completely agree with your point!'
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.linkedin.com/rest/socialActions/urn%3Ali%3Ashare%3A7123456789/comments',
            {
                actor: 'urn:li:organization:99887766',
                message: {
                    text: 'We completely agree with your point!'
                },
                parentComment: 'urn:li:comment:(urn:li:share:7123456789,1001)'
            },
            expect.any(Object)
        )

        expect(result.output.success).toBe(true)
        expect(result.output.commentId).toBe('urn:li:comment:(urn:li:share:7123456789,2002)')
    })

    it('should parse LinkedIn post URL into target URN', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {},
            headers: { 'x-restli-id': 'urn:li:comment:(urn:li:activity:7123456789,3003)' }
        })

        const nodeData = {
            id: 'linkedInComment_0',
            inputs: {
                actorType: 'organization',
                organizationId: '99887766',
                targetPostUrn: 'https://www.linkedin.com/feed/update/urn:li:activity:7123456789/',
                commentType: 'comment',
                messageText: 'Testing URL extraction'
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.linkedin.com/rest/socialActions/urn%3Ali%3Aactivity%3A7123456789/comments',
            expect.any(Object),
            expect.any(Object)
        )

        expect(result.output.success).toBe(true)
    })

    it('should throw error when comment text is empty', async () => {
        const nodeData = {
            id: 'linkedInComment_0',
            inputs: {
                actorType: 'organization',
                organizationId: '99887766',
                targetPostUrn: 'urn:li:share:7123456789',
                messageText: '   '
            }
        }

        await expect(node.run(nodeData, '', {})).rejects.toThrow('Comment Text is empty.')
    })

    it('should throw error when target post URN is missing', async () => {
        const nodeData = {
            id: 'linkedInComment_0',
            inputs: {
                actorType: 'organization',
                organizationId: '99887766',
                targetPostUrn: '',
                messageText: 'Comment without post'
            }
        }

        await expect(node.run(nodeData, '', {})).rejects.toThrow('Target Post URN is required.')
    })

    it('should throw error when parentCommentUrn is missing for reply', async () => {
        const nodeData = {
            id: 'linkedInComment_0',
            inputs: {
                actorType: 'organization',
                organizationId: '99887766',
                targetPostUrn: 'urn:li:share:7123456789',
                commentType: 'reply',
                parentCommentUrn: '',
                messageText: 'Reply without parent'
            }
        }

        await expect(node.run(nodeData, '', {})).rejects.toThrow('Parent Comment URN is required when replying to an existing comment.')
    })

    it('should handle continueOnFail gracefully when LinkedIn API fails', async () => {
        mockedAxios.post.mockRejectedValueOnce({
            message: 'Request failed with status code 403',
            response: {
                status: 403,
                data: { message: 'Not authorized to comment on this organization post' }
            }
        })

        const nodeData = {
            id: 'linkedInComment_0',
            inputs: {
                actorType: 'organization',
                organizationId: '99887766',
                targetPostUrn: 'urn:li:share:7123456789',
                messageText: 'Failed comment attempt',
                continueOnFail: true
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(result.output.success).toBe(false)
        expect(result.output.content.status).toBe(403)
        expect(result.output.content.details).toEqual({
            message: 'Not authorized to comment on this organization post'
        })
    })
})
