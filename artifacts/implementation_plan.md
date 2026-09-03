# Dedicated Telegram Send Node & Credential

Integrate a dedicated **Telegram Send** (`TelegramSend` / `telegramSendAgentflow`) node and a **Telegram Bot API** credential (`TelegramApi` / `telegramApi`) into Flowise, allowing Agentflows to receive messages via Telegram webhooks and send replies directly to Telegram chats, groups, and channels.

## User Review Required

> [!NOTE]
> This node follows the exact pattern of the existing `WhatsAppSend` and `FacebookMessengerSend` nodes:
>
> 1. **Inbound**: Handled via Flowise's Start node in `webhookTrigger` mode with `{{ $webhook.body.message.text }}` and session tracking via `{{ $webhook.body.message.chat.id }}`.
> 2. **Outbound**: Handled by the dedicated `TelegramSend` node which calls `POST https://api.telegram.org/bot<token>/sendMessage`.
> 3. **Multi-tenant / Dynamic tokens**: Supports dynamic bot tokens passed via `overrideConfig.vars.userTelegramToken` or `overrideConfig.vars.telegramBotToken` in addition to stored Flowise credentials.

## Proposed Changes

### Components (`packages/components`)

#### [NEW] [`TelegramApi.credential.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/credentials/TelegramApi.credential.ts)

Create the credential definition for Telegram:

-   Name: `telegramApi`
-   Label: `Telegram Bot API`
-   Fields:
    -   `botToken` (type: `password`, required): Telegram Bot Token from `@BotFather`.
    -   `baseUrl` (type: `string`, optional, default: `https://api.telegram.org`): Customizable for local Telegram Bot API servers or proxies.

#### [NEW] [`TelegramSend.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/TelegramSend/TelegramSend.ts)

Implement the node class `TelegramSend_Agentflow`:

-   Category: `Agent Flows`
-   Color: `#229ED9` (Telegram blue)
-   Icon: `telegram.svg`
-   Inputs:
    -   `chatId`: Unique identifier for the target chat or username (`acceptVariable: true`, default `{{ $webhook.body.message.chat.id }}`)
    -   `messageText`: Text message content (`acceptVariable: true`, rows: 4)
    -   `parseMode`: Options (`None`, `Markdown`, `MarkdownV2`, `HTML`, default: `None`)
    -   `replyToMessageId`: Optional message ID to reply to (`acceptVariable: true`)
    -   `continueOnFail`: Boolean flag to prevent terminating flow on API error
-   Dynamic token resolution: supports `overrideConfig.vars.userTelegramToken` and credential data.

#### [NEW] [`telegram.svg`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/TelegramSend/telegram.svg)

Official Telegram paper-plane vector icon.

#### [NEW] [`TelegramSend.test.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/TelegramSend/TelegramSend.test.ts)

Unit tests covering:

-   Metadata validation (label, name, category, icon, color)
-   Dispatching message to Telegram Bot API with correct headers, payload, and URL
-   Validation errors for missing token, chat ID, and message text
-   `continueOnFail` handling
-   Optional fields like `parseMode` and `replyToMessageId`

---

### Chatflow Templates (`chatflows/`)

#### [NEW] [`telegram_bot_agentflow.json`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/chatflows/telegram_bot_agentflow.json)

A ready-to-import template showing an end-to-end Telegram bot flow:

-   Start node configured with `webhookTrigger`, extracting `message.text` and `message.chat.id`
-   Agent / LLM processing node
-   Telegram Send node dispatching the response back to the user

---

## Verification Plan

### Automated Tests

-   Run `pnpm --filter flowise-components test TelegramSend`
-   Run `pnpm --filter flowise-components build` to confirm TypeScript compilation and icon bundling pass cleanly.

### Manual Verification

-   Verify the node is discovered in `NodesPool` under `Agent Flows`.
-   Verify the credential is recognized in `componentCredentials`.
