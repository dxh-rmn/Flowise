# Walkthrough - FlowAgent Session ID Fix & Database Normalization

## Overview of Changes

We identified and resolved two root causes for the session ID issues across FlowAgent, child flow execution, and the database:

1. **HTML Tag Corruption in Session ID**:

    - The Start node's `webhooksSessionId` in `devxhub rag agent` had been stored with rich-text HTML wrapper tags (`<p></p><pre><code class="language-text">...</code></pre><p></p>`).
    - Webhook controller now actively sanitizes `resolvedMemorySessionId` by stripping any HTML tags before setting `req.body.overrideConfig.sessionId`.
    - The PostgreSQL database (`ai-agents`) `chat_flow`, `execution`, and `chat_message` records have been cleaned and normalized.

2. **Session ID Propagation Loss in `ExecuteFlow`**:
    - When `devxhub rag agent` executed the subflow `devxhub knowledge local`, `ExecuteFlow` previously only sent `chatId: options.chatId` (a unique random UUID generated per request) without forwarding `sessionId`.
    - Updated `ExecuteFlow` to forward `sessionId: currentSessionId` and merge `sessionId` into `overrideConfig.sessionId`, ensuring the child flow's memory (`BufferMemory` / QA Chain) correctly retains conversational history across turns for each WhatsApp user.

---

## Changes Made

### 1. Webhook Controller ([packages/server/src/controllers/webhook/index.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/controllers/webhook/index.ts))

-   Added HTML tag sanitization and trimming to `resolvedMemorySessionId`:
    ```ts
    const rawResolvedMemorySessionId =
        sessionId != null ? String(sessionId) : webhooksSessionId ? resolveWebhookRefs(webhooksSessionId, req.body.webhook) : undefined
    const resolvedMemorySessionId = rawResolvedMemorySessionId ? rawResolvedMemorySessionId.replace(/<[^>]*>/g, '').trim() : undefined
    if (resolvedMemorySessionId && !resolvedMemorySessionId.includes('{{')) {
        req.body.overrideConfig = { ...(req.body.overrideConfig ?? {}), sessionId: resolvedMemorySessionId }
    }
    ```

### 2. ExecuteFlow Node ([packages/components/nodes/agentflow/ExecuteFlow/ExecuteFlow.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/ExecuteFlow/ExecuteFlow.ts))

-   Added automatic session ID forwarding to child predictions:

    ```ts
    const currentSessionId = options.sessionId ? String(options.sessionId).replace(/<[^>]*>/g, '').trim() : undefined
    const mergedOverrideConfig = {
        ...(typeof overrideConfig === 'object' && overrideConfig !== null ? overrideConfig : {}),
        ...(currentSessionId ? { sessionId: (overrideConfig as any)?.sessionId || currentSessionId } : {})
    }

    // Inside AxiosRequestConfig data:
    data: {
        question: flowInput,
        chatId: options.chatId,
        sessionId: currentSessionId,
        overrideConfig: mergedOverrideConfig
    }
    ```

### 3. Database Data Cleanup & Normalization (`ai-agents` DB)

-   **`chat_flow` table**:
    -   Cleaned `webhooksSessionId` in `devxhub rag agent` (`7a0e6281-04f5-43b9-8ef3-f620b863f32b`) to `{{ $webhook.body.entry[0].changes[0].value.messages[0].from }}`.
    -   Cleaned `recipientPhoneNumber` to `{{ $webhook.body.entry[0].changes[0].value.messages[0].from }}`.
-   **`execution` table**:
    -   Sanitized 16 records containing HTML wrapper tags, normalizing `sessionId` values to plain strings (e.g. `8801716814563`).
-   **`chat_message` table**:
    -   Sanitized 32 records containing HTML wrapper tags, normalizing `sessionId` values to plain strings.

---

## Verification Results

1. **Database Sanitization Verification**:

    - `SELECT COUNT(*) FROM chat_message WHERE "sessionId" LIKE '%<%' OR "sessionId" LIKE '%>%';` &rarr; **`0`**
    - `SELECT COUNT(*) FROM execution WHERE "sessionId" LIKE '%<%' OR "sessionId" LIKE '%>%';` &rarr; **`0`**
    - Distinct phone numbers in `chat_message`: `8801716814563`, `8801303340936`.

2. **Automated Logic & Propagation Test**:

    - Ran test suite validating dirty HTML template sanitization (`<p><pre><code>...</code></pre></p>` &rarr; `'8801716814563'`) and `ExecuteFlow` payload creation with `overrideConfig.sessionId`:
        ```
        Result of sanitized dirty template: 8801716814563
        Result of clean template: 8801716814563
        ExecuteFlow Data Payload: {
          "question": "dhakay ki office ache?",
          "chatId": "mock-uuid-chat-id",
          "sessionId": "8801716814563",
          "overrideConfig": {
            "sessionId": "8801716814563"
          }
        }
        All session ID sanitization & propagation assertions PASSED!
        ```

3. **Build Verification**:
    - `flowise-components` built successfully.
    - `flowise` (server) built successfully.
