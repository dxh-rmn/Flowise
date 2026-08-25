import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { v4 as uuidv4 } from 'uuid'
import { RateLimiterManager } from '../../utils/rateLimit'
import predictionsServices from '../../services/predictions'
import chatflowsService from '../../services/chatflows'
import webhookService from '../../services/webhook'
import { getWebhookListenerRegistry } from '../../services/webhook-listener'
import { redactSensitiveHeaders } from 'flowise-components'
import { ChatType } from '../../Interface'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { dispatchCallback } from '../../utils/callbackDispatcher'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import logger from '../../utils/logger'

import { resolveWebhookRefs } from '../../utils/buildAgentflow'

const createWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: webhookController.createWebhook - id not provided!`)
        }

        const userId = req.user?.id

        // For form-encoded requests, unwrap JSON encoded in a `payload` field (e.g. GitHub webhooks)
        // so $webhook.body.* resolves against the actual payload fields.
        const contentType = (req.headers['content-type'] ?? '').toLowerCase()
        let body = req.body
        if (contentType.startsWith('application/x-www-form-urlencoded') && typeof body?.payload === 'string') {
            try {
                body = JSON.parse(body.payload)
            } catch {
                // leave body as-is if payload isn't valid JSON
            }
        }

        const isResume = body?.humanInput != null

        // Meta WhatsApp sends status/echo events (sent, delivered, read) that carry a `statuses`
        // array but no `messages`. Running the flow for those would burn LLM calls, fail at the
        // WhatsApp Send node (recipient unresolved -> "000"), and Meta retries every non-200
        // response — so acknowledge with 200 and skip them immediately. Only WhatsApp-style
        // payloads are filtered; other webhook senders (GitHub, Stripe, etc.) are unaffected.
        if (req.method?.toUpperCase() === 'POST' && !isResume && body?.object === 'whatsapp_business_account') {
            const metaValue = body?.entry?.[0]?.changes?.[0]?.value
            const hasWhatsAppMessages = Array.isArray(metaValue?.messages) && metaValue.messages.length > 0
            if (!hasWhatsAppMessages) {
                return res.status(200).json({ received: true })
            }
        }

        // Meta Facebook Messenger sends delivery, read, and echo receipts (delivery, read, standby)
        // that carry no incoming user message or have is_echo: true. Running the flow for those would
        // burn LLM calls, fail at the Facebook Send node, and Meta retries every non-200 response —
        // so acknowledge with 200 and skip them immediately.
        if (req.method?.toUpperCase() === 'POST' && !isResume && body?.object === 'page') {
            const messagingList = body?.entry?.[0]?.messaging
            const hasFacebookMessage =
                Array.isArray(messagingList) &&
                messagingList.some((item: any) => item?.message != null && !item?.message?.is_echo)
            if (!hasFacebookMessage) {
                return res.status(200).json({ received: true })
            }
        }

        const { responseMode, callbackUrl, callbackSecret, isHandshake, challenge, webhooksSessionId } =
            await webhookService.validateWebhookChatflow(
                req.params.id,
                userId,
                body,
                req.method,
                req.headers,
                req.query,
                (req as any).rawBody,
                isResume ? { skipFieldValidation: true } : undefined
            )

        // Meta WhatsApp Webhook GET Verification Handshake
        if (isHandshake && challenge != null) {
            return res.status(200).send(challenge)
        }

        // Namespace the webhook payload so $webhook.body.*, $webhook.headers.*, $webhook.query.* can coexist
        req.body = {
            webhook: {
                body,
                headers: redactSensitiveHeaders(req.headers as Record<string, any>),
                query: req.query
            }
        }

        const { humanInput, chatId: bodyChatId, sessionId } = body ?? {}
        if (humanInput != null) req.body.humanInput = humanInput
        if (bodyChatId != null) req.body.chatId = bodyChatId

        // Session ID resolution: explicit body.sessionId > dynamic webhooksSessionId template.
        // Written into overrideConfig.sessionId because that is what executeAgentFlow and
        // getMemorySessionId actually read (incomingInput.sessionId itself is never consumed).
        const rawResolvedMemorySessionId =
            sessionId != null ? String(sessionId) : webhooksSessionId ? resolveWebhookRefs(webhooksSessionId, req.body.webhook) : undefined
        const resolvedMemorySessionId = rawResolvedMemorySessionId ? rawResolvedMemorySessionId.replace(/<[^>]*>/g, '').trim() : undefined
        if (resolvedMemorySessionId && !resolvedMemorySessionId.includes('{{')) {
            req.body.overrideConfig = { ...(req.body.overrideConfig ?? {}), sessionId: resolvedMemorySessionId }
        }

        const executionChatId: string = (bodyChatId as string | undefined) ?? uuidv4()
        req.body.chatId = executionChatId

        // Mirror this execution's events to any UI panels currently listening to this flow.
        try {
            await getWebhookListenerRegistry().bindExecution(req.params.id, executionChatId)
        } catch (err) {
            logger.warn(`[webhookController] Failed to bind webhook listeners: ${getErrorMessage(err)}`)
        }

        if (responseMode === 'stream') {
            // Streaming mode: open an SSE channel and let downstream nodes push events through sseStreamer
            // Falls back to synchronous JSON if the chatflow has no streaming-capable end nodes
            const streamable = await chatflowsService.checkIfChatflowIsValidForStreaming(req.params.id)
            if (streamable?.isStreaming) {
                const sseStreamer = getRunningExpressApp().sseStreamer
                const chatId = executionChatId
                req.body.streaming = true

                res.setHeader('Content-Type', 'text/event-stream')
                res.setHeader('Cache-Control', 'no-cache')
                res.setHeader('Connection', 'keep-alive')
                res.setHeader('X-Accel-Buffering', 'no')
                res.flushHeaders()
                sseStreamer.addExternalClient(chatId, res)

                try {
                    const apiResponse = await predictionsServices.buildChatflow(req, ChatType.WEBHOOK)
                    sseStreamer.streamMetadataEvent(chatId, apiResponse)
                } catch (err: any) {
                    sseStreamer.streamErrorEvent(chatId, getErrorMessage(err))
                } finally {
                    sseStreamer.removeClient(chatId)
                }
                return
            }
        }

        if (responseMode === 'async') {
            // Validate the callback URL only when one was provided. Without a URL, the flow runs
            // fire-and-forget — the 200 still goes out, but no callback is delivered when it finishes.
            if (callbackUrl) {
                try {
                    const parsed = new URL(callbackUrl)
                    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error()
                } catch {
                    throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, `Invalid callbackUrl: must be a valid http or https URL`)
                }
            }

            // Meta treats any non-200 webhook response as a delivery failure and retries the
            // event with backoff for up to 7 days — so respond 200 while the flow runs
            // fire-and-forget in the background.
            const chatId = executionChatId

            res.status(200).json({ chatId, status: 'PROCESSING' })

            setImmediate(async () => {
                try {
                    const apiResponse = await predictionsServices.buildChatflow(req, ChatType.WEBHOOK)

                    if (!callbackUrl) {
                        getRunningExpressApp().sseStreamer.removeClient(chatId)
                        return // fire-and-forget — no delivery
                    }

                    // apiResponse.action is the parsed humanInputAction — only present when flow is STOPPED (FLOWISE-387)
                    if (apiResponse.action) {
                        await dispatchCallback(
                            callbackUrl,
                            {
                                status: 'STOPPED',
                                chatId,
                                data: { text: apiResponse.text, executionId: apiResponse.executionId, action: apiResponse.action }
                            },
                            callbackSecret
                        )
                    } else {
                        await dispatchCallback(callbackUrl, { status: 'SUCCESS', chatId, data: apiResponse }, callbackSecret)
                    }
                } catch (err: any) {
                    if (callbackUrl) {
                        await dispatchCallback(callbackUrl, { status: 'ERROR', chatId, error: getErrorMessage(err) }, callbackSecret)
                    } else {
                        logger.error(`[webhookController] fire-and-forget execution failed for chatId=${chatId}: ${getErrorMessage(err)}`)
                    }
                } finally {
                    // Notify webhook listeners that this execution is done; their SSE connections stay open.
                    getRunningExpressApp().sseStreamer.removeClient(chatId)
                }
            })
            return
        }

        try {
            const apiResponse = await predictionsServices.buildChatflow(req, ChatType.WEBHOOK)
            return res.json(apiResponse)
        } finally {
            getRunningExpressApp().sseStreamer.removeClient(executionChatId)
        }
    } catch (error) {
        next(error)
    }
}

const getRateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        return RateLimiterManager.getInstance().getRateLimiter()(req, res, next)
    } catch (error) {
        next(error)
    }
}

export default {
    createWebhook,
    getRateLimiterMiddleware
}
