# Walkthrough: Dedicated Telegram Bot Integration

Added a dedicated **Telegram Send** (`TelegramSend` / `telegramSendAgentflow`) node and a **Telegram Bot API** credential (`TelegramApi` / `telegramApi`) into Flowise, allowing Agentflows to receive messages via Telegram webhooks and send replies directly to Telegram chats, groups, and channels.

---

## What Was Added

### 1. Telegram Bot API Credential

-   **File**: [TelegramApi.credential.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/credentials/TelegramApi.credential.ts)
-   **Credential Name**: `telegramApi`
-   **Fields**:
    -   `botToken` (password, required): Bot Token from `@BotFather`.
    -   `baseUrl` (string, optional, default: `https://api.telegram.org`): Base URL for standard or self-hosted Bot API servers.

### 2. Dedicated Telegram Send Node

-   **File**: [TelegramSend.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/TelegramSend/TelegramSend.ts)
-   **Node Type**: `TelegramSend` (`telegramSendAgentflow`)
-   **Category**: `Agent Flows`
-   **Color**: `#229ED9` (Telegram Blue)
-   **Icon**: [telegram.svg](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/TelegramSend/telegram.svg)
-   **Inputs**:
    -   `chatId`: Unique identifier for the target chat or username (`acceptVariable: true`, default `{{ $webhook.body.message.chat.id }}`).
    -   `messageText`: Text content to send (`acceptVariable: true`).
    -   `parseMode`: Formatting mode (`none`, `Markdown`, `MarkdownV2`, `HTML`).
    -   `replyToMessageId`: Optional message ID to reply directly to (`acceptVariable: true`).
    -   `disableWebPagePreview`: Toggle link previews.
    -   `continueOnFail`: Prevents flow termination if Telegram API encounters an error.
-   **Dynamic Token Resolution**: Supports tenant-specific override tokens via `overrideConfig.vars.userTelegramToken` or `overrideConfig.vars.telegramBotToken`.

### 3. Comprehensive Unit Tests

-   **File**: [TelegramSend.test.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/TelegramSend/TelegramSend.test.ts)
-   Verified 8 test cases:
    1. Node metadata (label, name, category, icon, color).
    2. Message dispatch with minimal inputs (`chatId`, `messageText`).
    3. Message dispatch with optional parameters (`parseMode`, `replyToMessageId`, `disableWebPagePreview`).
    4. Dynamic token override from `overrideConfig.vars`.
    5. Validation when `chatId` is missing.
    6. Validation when `messageText` is missing.
    7. API failure handling when `continueOnFail` is false (throws formatted error).
    8. API failure handling when `continueOnFail` is true (returns failure in output without crashing flow).

### 4. Agentflow Templates

-   **File**: [telegram_chatflow_agentflow.json](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/chatflows/telegram_chatflow_agentflow.json)
    -   Connects your existing Chatflow brain (`DevXHub Chatflow Brain` via `ExecuteFlow`) to Telegram:
        1. **Start Node**: Receives Telegram webhook, extracts `{{ $webhook.body.message.text }}`, maintains session memory via `{{ $webhook.body.message.chat.id }}`.
        2. **ExecuteFlow Node**: Executes your existing Chatflow (`7c10083e-62ca-4632-badc-5760aeaaddde`) with the user's message.
        3. **Telegram Send Node**: Dispatches the answer directly back to the user's Telegram chat.
        4. **Direct Reply Node**: Echoes execution confirmation and JSON response.
-   **File**: [telegram_bot_agentflow.json](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/chatflows/telegram_bot_agentflow.json)
    -   Minimal general template connecting a Webhook Start node, an AI node, and Telegram Send.

---

## Verification Results

### Automated Unit Tests

```bash
PASS nodes/agentflow/TelegramSend/TelegramSend.test.ts
  TelegramSend Node
    ✓ should have correct node metadata
    ✓ should dispatch Telegram message using chat ID and text
    ✓ should include parseMode, replyToMessageId, and disableWebPagePreview when provided
    ✓ should support dynamic bot token resolution from overrideConfig.vars
    ✓ should throw error when chat ID is missing
    ✓ should throw error when message text is missing
    ✓ should throw error when Telegram API fails and continueOnFail is false
    ✓ should return error in output without throwing when continueOnFail is true

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
```

### Build & Compilation

-   `pnpm build` completed with zero errors for Telegram components.
-   Output compiled into:
    -   `dist/nodes/agentflow/TelegramSend/TelegramSend.js`
    -   `dist/nodes/agentflow/TelegramSend/telegram.svg`
    -   `dist/credentials/TelegramApi.credential.js`

---

## How to Import & Use

1. **Import the Flow**:
    - In Flowise UI, go to **Agentflows** -> Click **Load / Import** -> Select [telegram_chatflow_agentflow.json](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/chatflows/telegram_chatflow_agentflow.json).
2. **Configure Credential & Webhook**:
    - Add your **Telegram Bot API** credential with your bot token from `@BotFather`.
    - On the `Telegram Send` node, select your credential.
    - Point Telegram's webhook to your Flowise Webhook URL:
        ```bash
        curl -F "url=https://<your-flowise-domain>/api/v1/webhook/<NEW_AGENTFLOW_ID>" \
          https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
        ```
3. Test by sending a message to your bot in Telegram!
