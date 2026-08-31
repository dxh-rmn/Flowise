import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('../../../src/utils', () => ({
    getCredentialData: jest.fn().mockResolvedValue({
        accessToken: 'mock-page-access-token',
        pageId: '123456789'
    })
}))

const { nodeClass } = require('./FacebookPagePost')

describe('FacebookPagePost Node', () => {
    let node: any

    beforeEach(() => {
        node = new nodeClass()
        jest.clearAllMocks()
    })

    it('should have correct node metadata', () => {
        expect(node.label).toBe('Facebook Page Post')
        expect(node.name).toBe('facebookPagePostAgentflow')
        expect(node.type).toBe('FacebookPagePost')
        expect(node.category).toBe('Agent Flows')
        expect(node.icon).toBe('facebook.svg')
    })

    it('should publish post to Page feed', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { id: '123456789_987654321' } })

        const nodeData = {
            id: 'facebookPagePost_0',
            inputs: {
                pageId: '123456789',
                messageText: 'New company blog post published!',
                linkUrl: 'https://devxhub.com/blog/ai-agent'
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://graph.facebook.com/v20.0/123456789/feed',
            {
                message: 'New company blog post published!',
                link: 'https://devxhub.com/blog/ai-agent'
            },
            {
                headers: {
                    Authorization: 'Bearer mock-page-access-token',
                    'Content-Type': 'application/json'
                }
            }
        )

        expect(result.output.success).toBe(true)
        expect(result.output.content).toEqual({ id: '123456789_987654321' })
    })

    it('should throw error when message text is empty', async () => {
        const nodeData = {
            id: 'facebookPagePost_0',
            inputs: {
                pageId: '123456789',
                messageText: ''
            }
        }

        await expect(node.run(nodeData, '', {})).rejects.toThrow('Post Content is empty.')
    })
})
