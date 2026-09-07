import axios from 'axios'
import * as crypto from 'crypto'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockGetCredentialData = jest.fn()
jest.mock('../../../src/utils', () => ({
    getCredentialData: (...args: any[]) => mockGetCredentialData(...args)
}))

const { nodeClass } = require('./FacebookPagePost')

describe('FacebookPagePost Node', () => {
    let node: any

    beforeEach(() => {
        node = new nodeClass()
        jest.clearAllMocks()
        mockGetCredentialData.mockResolvedValue({
            accessToken: 'mock-page-access-token',
            pageId: '123456789'
        })
    })

    it('should have correct node metadata', () => {
        expect(node.label).toBe('Facebook Page Post')
        expect(node.name).toBe('facebookPagePostAgentflow')
        expect(node.type).toBe('FacebookPagePost')
        expect(node.category).toBe('Agent Flows')
        expect(node.icon).toBe('facebook.svg')
    })

    it('should publish post to Page feed without appSecret', async () => {
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
                },
                params: {}
            }
        )

        expect(result.output.success).toBe(true)
        expect(result.output.content).toEqual({ id: '123456789_987654321' })
    })

    it('should calculate and pass appsecret_proof when appSecret is provided', async () => {
        mockGetCredentialData.mockResolvedValueOnce({
            accessToken: 'mock-token',
            appSecret: 'page-secret-123'
        })
        mockedAxios.post.mockResolvedValueOnce({ data: { id: 'post-id-123' } })

        const expectedProof = crypto.createHmac('sha256', 'page-secret-123').update('mock-token').digest('hex')

        const nodeData = {
            id: 'facebookPagePost_0',
            inputs: {
                pageId: '123456789',
                messageText: 'Secure page post'
            }
        }

        await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://graph.facebook.com/v20.0/123456789/feed',
            expect.any(Object),
            expect.objectContaining({
                params: {
                    appsecret_proof: expectedProof
                }
            })
        )
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
