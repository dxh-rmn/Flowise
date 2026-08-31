import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('../../../src/utils', () => ({
    getCredentialData: jest.fn().mockResolvedValue({
        accessToken: 'mock-page-access-token',
        pageId: '123456789'
    })
}))

const { nodeClass } = require('./FacebookMessengerSend')

describe('FacebookMessengerSend Node', () => {
    let node: any

    beforeEach(() => {
        node = new nodeClass()
        jest.clearAllMocks()
    })

    it('should have correct node metadata', () => {
        expect(node.label).toBe('Facebook Messenger Send')
        expect(node.name).toBe('facebookMessengerSendAgentflow')
        expect(node.type).toBe('FacebookMessengerSend')
        expect(node.category).toBe('Agent Flows')
        expect(node.icon).toBe('messenger.svg')
    })

    it('should dispatch Messenger reply using recipient PSID', async () => {
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
                }
            }
        )

        expect(result.output.success).toBe(true)
        expect(result.output.content).toEqual({ message_id: 'mid.12345', recipient_id: 'user_psid_999' })
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
