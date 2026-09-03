import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('../../../src/utils', () => ({
    getCredentialData: jest.fn().mockResolvedValue({
        botToken: 'mock-bot-token-123456',
        baseUrl: 'https://api.telegram.org'
    })
}))

const { nodeClass } = require('./TelegramSend')

describe('TelegramSend Node', () => {
    let node: any

    beforeEach(() => {
        node = new nodeClass()
        jest.clearAllMocks()
    })

    it('should have correct node metadata', () => {
        expect(node.label).toBe('Telegram Send')
        expect(node.name).toBe('telegramSendAgentflow')
        expect(node.type).toBe('TelegramSend')
        expect(node.category).toBe('Agent Flows')
        expect(node.icon).toBe('telegram.svg')
        expect(node.color).toBe('#229ED9')
    })

    it('should dispatch Telegram message using chat ID and text', async () => {
        const mockResponse = {
            ok: true,
            result: {
                message_id: 101,
                chat: { id: 123456789, first_name: 'TestUser' },
                text: 'Hello from DevXHub Telegram bot!'
            }
        }
        mockedAxios.post.mockResolvedValueOnce({ data: mockResponse })

        const nodeData = {
            id: 'telegramSend_0',
            inputs: {
                chatId: '123456789',
                messageText: 'Hello from DevXHub Telegram bot!'
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.telegram.org/botmock-bot-token-123456/sendMessage',
            {
                chat_id: '123456789',
                text: 'Hello from DevXHub Telegram bot!'
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )

        expect(result.output.success).toBe(true)
        expect(result.output.content).toEqual(mockResponse)
    })

    it('should include parseMode, replyToMessageId, and disableWebPagePreview when provided', async () => {
        const mockResponse = { ok: true, result: { message_id: 102 } }
        mockedAxios.post.mockResolvedValueOnce({ data: mockResponse })

        const nodeData = {
            id: 'telegramSend_0',
            inputs: {
                chatId: '987654321',
                messageText: '<b>Bold message</b>',
                parseMode: 'HTML',
                replyToMessageId: '55',
                disableWebPagePreview: true
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.telegram.org/botmock-bot-token-123456/sendMessage',
            {
                chat_id: '987654321',
                text: '<b>Bold message</b>',
                parse_mode: 'HTML',
                reply_to_message_id: 55,
                disable_web_page_preview: true
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )

        expect(result.output.success).toBe(true)
    })

    it('should support dynamic bot token resolution from overrideConfig.vars', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { ok: true } })

        const nodeData = {
            id: 'telegramSend_0',
            inputs: {
                chatId: '123456789',
                messageText: 'Dynamic token message'
            }
        }

        const options = {
            overrideConfig: {
                vars: {
                    userTelegramToken: 'dynamic-user-token-999'
                }
            }
        }

        await node.run(nodeData, '', options)

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.telegram.org/botdynamic-user-token-999/sendMessage',
            expect.any(Object),
            expect.any(Object)
        )
    })

    it('should throw error when chat ID is missing', async () => {
        const nodeData = {
            id: 'telegramSend_0',
            inputs: {
                chatId: '',
                messageText: 'Hello'
            }
        }

        await expect(node.run(nodeData, '', {})).rejects.toThrow('Telegram Chat ID is empty or invalid.')
    })

    it('should throw error when message text is missing', async () => {
        const nodeData = {
            id: 'telegramSend_0',
            inputs: {
                chatId: '123456789',
                messageText: ''
            }
        }

        await expect(node.run(nodeData, '', {})).rejects.toThrow('Message Text is empty.')
    })

    it('should throw error when Telegram API fails and continueOnFail is false', async () => {
        mockedAxios.post.mockRejectedValueOnce({
            response: {
                data: {
                    ok: false,
                    error_code: 400,
                    description: 'Bad Request: chat not found'
                }
            }
        })

        const nodeData = {
            id: 'telegramSend_0',
            inputs: {
                chatId: 'invalid_chat_id',
                messageText: 'Test fail'
            }
        }

        await expect(node.run(nodeData, '', {})).rejects.toThrow('Telegram API call failed')
    })

    it('should return error in output without throwing when continueOnFail is true', async () => {
        mockedAxios.post.mockRejectedValueOnce({
            response: {
                data: {
                    ok: false,
                    error_code: 403,
                    description: 'Forbidden: bot was blocked by the user'
                }
            }
        })

        const nodeData = {
            id: 'telegramSend_0',
            inputs: {
                chatId: 'blocked_chat_id',
                messageText: 'Test blocked',
                continueOnFail: true
            }
        }

        const result = await node.run(nodeData, '', {})

        expect(result.output.success).toBe(false)
        expect(result.output.content.details.description).toBe('Forbidden: bot was blocked by the user')
    })
})
