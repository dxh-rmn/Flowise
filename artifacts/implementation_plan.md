# Meta App Secret Proof (`appsecret_proof`) and Typing Indicator Support

This plan implements cryptographic `appsecret_proof` generation and Meta Messenger **Typing Indicator / Sender Actions** (`typing_on`, `mark_seen`, `typing_off`) across the Facebook Agentflow nodes in Flowise.

---

## User Review Required

> [!NOTE]
>
> 1. **`appsecret_proof`**: Automatically calculated via `crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex')` and attached as a query param `?appsecret_proof=...` on all Meta Graph API requests when `appSecret` is provided (either via credential or `overrideConfig.vars.facebookAppSecret`). If `appSecret` is omitted, standard requests continue without breaking changes.
> 2. **Typing Indicator Modes**:
>     - **Modular / Immediate mode**: Place a `FacebookMessengerSend` node set to `Action: Sender Action -> Typing On` right after the Webhook Start node. Messenger immediately displays the typing bubble while downstream LLM nodes think.
>     - **Inline simulation mode**: Enable `Simulate Typing Indicator` directly on the message-sending node with an optional duration delay (e.g. 1–3s) before the message is delivered.
>     - **Mark Seen**: Support `mark_seen` so user messages receive read receipts.

---

## Proposed Changes

### Components (`packages/components`)

#### [MODIFY] [FacebookMessengerSend.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookMessengerSend/FacebookMessengerSend.ts)

-   **`appsecret_proof` Generation**:
    -   Extract `appSecret` from `credentialData?.appSecret` or `options.overrideConfig?.vars?.appSecret` / `facebookAppSecret`.
    -   If present, calculate HMAC-SHA256 hash and pass `params: { appsecret_proof }` to Axios.
-   **Action Type Selector**:
    -   `actionType`: `sendTextMessage` (default) vs `sendSenderAction` ("Sender Action / Typing Indicator").
-   **Sender Action Parameters**:
    -   `senderAction`: Options `typing_on` ("Typing Indicator On"), `mark_seen` ("Mark as Read"), `typing_off` ("Typing Indicator Off") when `actionType === 'sendSenderAction'`.
-   **Inline Typing Simulation**:
    -   When `actionType === 'sendTextMessage'`:
        -   `simulateTyping` (boolean, default `false`).
        -   `typingDelay` (number, default `1` second, optional).
        -   If enabled, calls `sender_action: "typing_on"` before dispatching the text message.

#### [MODIFY] [FacebookSend.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/FacebookSend.ts)

-   Add `sendMessengerSenderAction` to `actionType` options dropdown.
-   Add `senderAction` selector (`typing_on`, `mark_seen`, `typing_off`).
-   Add `simulateTyping` and `typingDelay` inputs for `sendMessengerMessage`.
-   Calculate and attach `appsecret_proof` to all Meta Graph API requests when `appSecret` is present.

#### [MODIFY] [FacebookPagePost.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookPagePost/FacebookPagePost.ts)

-   Extract `appSecret` and calculate `appsecret_proof`.
-   Attach `params: { appsecret_proof }` to `POST https://graph.facebook.com/v20.0/{pageId}/feed`.

#### [MODIFY] [FacebookMessengerSend.test.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookMessengerSend/FacebookMessengerSend.test.ts)

-   Add unit test: passes `appsecret_proof` in Axios request params when `appSecret` is set in credential.
-   Add unit test: dynamic `appSecret` override from `overrideConfig.vars`.
-   Add unit test: dispatches `sender_action: "typing_on"` payload without `message` body.
-   Add unit test: dispatches `sender_action: "mark_seen"`.
-   Add unit test: verifies `simulateTyping` triggers `typing_on` then message.

#### [MODIFY] [FacebookPagePost.test.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookPagePost/FacebookPagePost.test.ts)

-   Add unit test: verifies `appsecret_proof` is sent with Page Post request.

#### [MODIFY] [FacebookSend.test.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/FacebookSend.test.ts)

-   Add unit test: tests `sendMessengerSenderAction` and `appsecret_proof` in combined node.

---

### Templates (`chatflows/`)

#### [MODIFY] [facebook_messenger_combined_agentflow.json](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/chatflows/facebook_messenger_combined_agentflow.json)

-   Insert a `Facebook Messenger Send` node configured as `typing_on` directly after the Webhook Start node, demonstrating the best-practice architecture:
    `Start (Webhook)` ➔ `Facebook Messenger (typing_on)` ➔ `ExecuteFlow / LLM` ➔ `Facebook Messenger Send (Reply)`.

---

## Verification Plan

### Automated Tests

-   Run component tests:
    ```bash
    pnpm --filter flowise-components test FacebookMessengerSend
    pnpm --filter flowise-components test FacebookPagePost
    pnpm --filter flowise-components test FacebookSend
    ```
-   Run full components build:
    ```bash
    pnpm --filter flowise-components build
    ```

### Manual Verification

-   Confirm generated `dist` files contain `appsecret_proof` logic and `sender_action` handling.
-   Validate that the combined JSON template imports cleanly.
