import axios from 'axios'
import * as crypto from 'crypto'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockGetCredentialData = jest.fn()
jest.mock('../../../src/utils', () => ({
    getCredentialData: (...args: any[]) => mockGetCredentialData(...args)
}))

const { nodeClass } = require('./FacebookSend')

describe('FacebookSend Node (Combined)', () => {
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
        expect(node.label).toBe('Facebook Send')
        expect(node.name).toBe('facebookSendAgentflow')
        expect(node.type).toBe('FacebookSend')
        expect(node.category).toBe('Agent Flows')
        expect(node.icon).toBe('facebook.svg')
    })

    it('should send Messenger message when actionType is sendMessengerMessage', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { recipient_id: '12345', message_id: 'mid.123' } })

        const nodeData = {
            id: 'facebookSend_0',
            inputs: {
                actionType: 'sendMessengerMessage',
                recipientId: '12345',
                messageText: 'Hello from Messenger test!'
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://graph.facebook.com/v20.0/me/messages',
            {
                recipient: { id: '12345' },
                messaging_type: 'RESPONSE',
                message: { text: 'Hello from Messenger test!' }
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
        expect(result.output.content).toEqual({ recipient_id: '12345', message_id: 'mid.123' })
    })

    it('should dispatch typing_on when actionType is sendMessengerSenderAction', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { recipient_id: '12345' } })

        const nodeData = {
            id: 'facebookSend_0',
            inputs: {
                actionType: 'sendMessengerSenderAction',
                senderAction: 'typing_on',
                recipientId: '12345'
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://graph.facebook.com/v20.0/me/messages',
            {
                recipient: { id: '12345' },
                sender_action: 'typing_on'
            },
            expect.any(Object)
        )

        expect(result.output.success).toBe(true)
    })

    it('should calculate and attach appsecret_proof when appSecret is provided', async () => {
        mockGetCredentialData.mockResolvedValueOnce({
            accessToken: 'token-combined',
            appSecret: 'secret-combined'
        })
        mockedAxios.post.mockResolvedValueOnce({ data: { recipient_id: '12345' } })

        const expectedProof = crypto.createHmac('sha256', 'secret-combined').update('token-combined').digest('hex')

        const nodeData = {
            id: 'facebookSend_0',
            inputs: {
                actionType: 'sendMessengerSenderAction',
                senderAction: 'typing_on',
                recipientId: '12345'
            }
        }

        await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://graph.facebook.com/v20.0/me/messages',
            expect.any(Object),
            expect.objectContaining({
                params: {
                    appsecret_proof: expectedProof
                }
            })
        )
    })

    it('should publish post to Page feed when actionType is publishPagePost', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { id: '123456789_987654321' } })

        const nodeData = {
            id: 'facebookSend_0',
            inputs: {
                actionType: 'publishPagePost',
                pageId: '123456789',
                messageText: 'Hello from Page post test!',
                linkUrl: 'https://devxhub.com'
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://graph.facebook.com/v20.0/123456789/feed',
            {
                message: 'Hello from Page post test!',
                link: 'https://devxhub.com'
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

    it('should throw error when recipient PSID is missing in Messenger mode', async () => {
        const nodeData = {
            id: 'facebookSend_0',
            inputs: {
                actionType: 'sendMessengerMessage',
                recipientId: '',
                messageText: 'Hello'
            }
        }

        await expect(node.run(nodeData, '', {})).rejects.toThrow('Recipient PSID is empty or invalid.')
    })

    it('should throw error when messageText is empty in sendMessengerMessage', async () => {
        const nodeData = {
            id: 'facebookSend_0',
            inputs: {
                actionType: 'sendMessengerMessage',
                recipientId: '12345',
                messageText: ''
            }
        }

        await expect(node.run(nodeData, '', {})).rejects.toThrow('Message Text is empty.')
    })
})
