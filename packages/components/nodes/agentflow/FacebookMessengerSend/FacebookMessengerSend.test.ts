import axios from 'axios'
import * as crypto from 'crypto'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockGetCredentialData = jest.fn()
jest.mock('../../../src/utils', () => ({
    getCredentialData: (...args: any[]) => mockGetCredentialData(...args)
}))

const { nodeClass } = require('./FacebookMessengerSend')

describe('FacebookMessengerSend Node', () => {
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
        expect(node.label).toBe('Facebook Messenger Send')
        expect(node.name).toBe('facebookMessengerSendAgentflow')
        expect(node.type).toBe('FacebookMessengerSend')
        expect(node.category).toBe('Agent Flows')
        expect(node.icon).toBe('messenger.svg')
    })

    it('should dispatch Messenger reply using recipient PSID without appSecret', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { message_id: 'mid.12345', recipient_id: 'user_psid_999' } })

        const nodeData = {
            id: 'facebookMessengerSend_0',
            inputs: {
                recipientId: 'user_psid_999',
                messageText: 'Hello from DevXHub Messenger bot!'
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://graph.facebook.com/v20.0/me/messages',
            {
                recipient: { id: 'user_psid_999' },
                messaging_type: 'RESPONSE',
                message: { text: 'Hello from DevXHub Messenger bot!' }
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
        expect(result.output.content).toEqual({ message_id: 'mid.12345', recipient_id: 'user_psid_999' })
    })

    it('should calculate and pass appsecret_proof when appSecret is provided in credential', async () => {
        mockGetCredentialData.mockResolvedValueOnce({
            accessToken: 'token-123',
            appSecret: 'secret-xyz'
        })
        mockedAxios.post.mockResolvedValueOnce({ data: { message_id: 'mid.abc', recipient_id: 'psid-123' } })

        const expectedProof = crypto.createHmac('sha256', 'secret-xyz').update('token-123').digest('hex')

        const nodeData = {
            id: 'facebookMessengerSend_0',
            inputs: {
                recipientId: 'psid-123',
                messageText: 'Secure message'
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

    it('should calculate and pass appsecret_proof when passed via overrideConfig.vars', async () => {
        mockGetCredentialData.mockResolvedValueOnce({
            accessToken: 'token-dynamic'
        })
        mockedAxios.post.mockResolvedValueOnce({ data: { message_id: 'mid.xyz' } })

        const expectedProof = crypto.createHmac('sha256', 'dynamic-secret').update('token-dynamic').digest('hex')

        const nodeData = {
            id: 'facebookMessengerSend_0',
            inputs: {
                recipientId: 'psid-123',
                messageText: 'Dynamic secret test'
            }
        }

        const options = {
            overrideConfig: {
                vars: {
                    facebookAppSecret: 'dynamic-secret'
                }
            }
        }

        await node.run(nodeData, '', options)

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

    it('should dispatch typing_on sender action without message body', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { recipient_id: 'user_psid_999' } })

        const nodeData = {
            id: 'facebookMessengerSend_0',
            inputs: {
                actionType: 'sendSenderAction',
                senderAction: 'typing_on',
                recipientId: 'user_psid_999'
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://graph.facebook.com/v20.0/me/messages',
            {
                recipient: { id: 'user_psid_999' },
                sender_action: 'typing_on'
            },
            expect.objectContaining({
                headers: {
                    Authorization: 'Bearer mock-page-access-token',
                    'Content-Type': 'application/json'
                }
            })
        )

        expect(result.output.success).toBe(true)
        expect(result.input.senderAction).toBe('typing_on')
    })

    it('should dispatch mark_seen sender action', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { recipient_id: 'user_psid_999' } })

        const nodeData = {
            id: 'facebookMessengerSend_0',
            inputs: {
                actionType: 'sendSenderAction',
                senderAction: 'mark_seen',
                recipientId: 'user_psid_999'
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://graph.facebook.com/v20.0/me/messages',
            {
                recipient: { id: 'user_psid_999' },
                sender_action: 'mark_seen'
            },
            expect.any(Object)
        )

        expect(result.output.success).toBe(true)
    })

    it('should dispatch typing indicator before message when simulateTyping is true', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { recipient_id: 'user_psid_999' } }) // typing_on
            .mockResolvedValueOnce({ data: { message_id: 'mid.123', recipient_id: 'user_psid_999' } }) // message

        const nodeData = {
            id: 'facebookMessengerSend_0',
            inputs: {
                actionType: 'sendTextMessage',
                recipientId: 'user_psid_999',
                messageText: 'Hello after typing indicator',
                simulateTyping: true,
                typingDelay: 0.01 // very fast for tests
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledTimes(2)
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            1,
            'https://graph.facebook.com/v20.0/me/messages',
            {
                recipient: { id: 'user_psid_999' },
                sender_action: 'typing_on'
            },
            expect.any(Object)
        )
        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            2,
            'https://graph.facebook.com/v20.0/me/messages',
            {
                recipient: { id: 'user_psid_999' },
                messaging_type: 'RESPONSE',
                message: { text: 'Hello after typing indicator' }
            },
            expect.any(Object)
        )
        expect(result.output.success).toBe(true)
    })

    it('should throw error when recipient PSID is missing', async () => {
        const nodeData = {
            id: 'facebookMessengerSend_0',
            inputs: {
                recipientId: '',
                messageText: 'Hello'
            }
        }

        await expect(node.run(nodeData, '', {})).rejects.toThrow('Recipient PSID is empty or invalid.')
    })
})
