# Fix Session ID Issues in FlowAgent & Database

## Problem Analysis

Investigation of the PostgreSQL database (`ai-agents`) and the codebase revealed two critical session ID issues affecting the `devxhub rag agent` (Agentflow ID: `7a0e6281-04f5-43b9-8ef3-f620b863f32b`) and its child flow `devxhub knowledge local` (Chatflow ID: `0fc7c06b-ec41-43e7-8e4e-2d35f73162ab`):

1. **Session ID HTML Tag Corruption (`<p></p><pre><code class="language-text">8801716814563</code></pre><p></p>`)**:

    - In `chat_flow.flowData` for `devxhub rag agent`, the Start Node's `webhooksSessionId` was saved wrapped in HTML tags by the rich-text editor (`"<p></p><pre><code class=\"language-text\">{{$webhook.body.entry[0].changes[0].value.messages[0].from}}</code></pre><p></p>"`).
    - In [packages/server/src/controllers/webhook/index.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/controllers/webhook/index.ts), `resolveWebhookRefs(webhooksSessionId, req.body.webhook)` resolves the template variable but does not strip surrounding HTML tags.
    - Consequently, `sessionId` was written into `req.body.overrideConfig.sessionId` as `<p></p><pre><code class="language-text">8801716814563</code></pre><p></p>`, polluting both the `execution` and `chat_message` tables.

2. **Session ID Propagation Loss in `ExecuteFlow` Node**:
    - In [packages/components/nodes/agentflow/ExecuteFlow/ExecuteFlow.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/ExecuteFlow/ExecuteFlow.ts), `ExecuteFlow` receives `options.sessionId` and `options.chatId`, but calls `/api/v1/prediction/${selectedFlowId}` passing only `chatId: options.chatId` without forwarding `options.sessionId` in `overrideConfig.sessionId`.
    - Because `options.chatId` is a new random UUID generated per webhook request (`uuidv4()`), the child flow (`devxhub knowledge local`) falls back to using `chatId` as its session ID.
    - As a result, each message from a WhatsApp user was treated by the child flow as a brand new session, preventing conversational memory (`BufferMemory` / QA Chain) from maintaining context across turns.

---

## User Review Required

> [!IMPORTANT]
> A database data cleanup will be performed to sanitize existing dirty `sessionId` entries in `chat_message` and `execution` tables (converting `<p></p><pre><code>8801...</code></pre></p>` to `8801...`), and to update `chat_flow.flowData` for `devxhub rag agent` so template expressions are stored cleanly.

---

## Proposed Changes

### Server Webhook Controller & Resolution

#### [MODIFY] [packages/server/src/controllers/webhook/index.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/controllers/webhook/index.ts)

-   Sanitize `resolvedMemorySessionId` by stripping HTML tags (`.replace(/<[^>]*>/g, '').trim()`) before setting `req.body.overrideConfig.sessionId`.
-   Ensure any incoming `sessionId` or template-resolved `webhooksSessionId` produces a clean string without HTML tags or extra whitespace.

#### [MODIFY] [packages/server/src/utils/buildAgentflow.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/utils/buildAgentflow.ts)

-   Add HTML tag sanitization / stripping for template values when resolving webhook reference strings.

---

### Component Node: ExecuteFlow

#### [MODIFY] [packages/components/nodes/agentflow/ExecuteFlow/ExecuteFlow.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/ExecuteFlow/ExecuteFlow.ts)

-   Forward `sessionId: options.sessionId` in the HTTP payload to `/api/v1/prediction/${selectedFlowId}`.
-   Merge `options.sessionId` into `overrideConfig.sessionId` so that the child chatflow/agentflow inherits the exact session ID of the caller workflow, ensuring `getMemorySessionId()` in `buildChatflow.ts` preserves conversational memory.

---

### Database Normalization & Data Cleanup

#### [MODIFY] Database Tables (`ai-agents` PostgreSQL DB)

1. **`chat_flow` table**:
    - Update `flowData` for `devxhub rag agent` (`7a0e6281-04f5-43b9-8ef3-f620b863f32b`):
        - Replace `webhooksSessionId` HTML wrapping with clean `"{{ $webhook.body.entry[0].changes[0].value.messages[0].from }}"`.
        - Replace `recipientPhoneNumber` HTML wrapping with clean `"{{ $webhook.body.entry[0].changes[0].value.messages[0].from }}"`.
2. **`execution` table**:
    - Sanitize existing `sessionId` values: strip `<[^>]*>` tags to normalize phone numbers (e.g. `8801716814563`).
3. **`chat_message` table**:
    - Sanitize existing `sessionId` values: strip `<[^>]*>` tags to normalize phone numbers.

---

## Verification Plan

### Automated / DB Verification

-   Run database queries on PostgreSQL `chat_flow`, `execution`, and `chat_message` tables to verify clean `sessionId` values without any HTML tags.
-   Run unit/integration tests for webhook resolution and node execution:
    ```bash
    cd "/media/rumon/PLANT/devxhub/workflow agent/Flowise/packages/server" && npm test -- webhook.test.ts
    ```

### Manual Verification

-   Simulate/trigger webhook execution with a mock payload and verify:
    1. `req.body.overrideConfig.sessionId` receives clean `'8801716814563'`.
    2. `ExecuteFlow` forwards `sessionId: '8801716814563'` to `devxhub knowledge local`.
    3. `chat_message` records in both parent and child flows share the identical clean `sessionId` (`8801716814563`).
