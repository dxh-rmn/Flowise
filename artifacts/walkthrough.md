# Walkthrough: Meta `appsecret_proof` and Typing Indicator / Sender Actions

Added cryptographic **`appsecret_proof`** generation and Meta Messenger **Typing Indicator / Sender Actions** (`typing_on`, `mark_seen`, `typing_off`) to the Facebook Agentflow nodes in Flowise.

---

## What Was Added & Modified

### 1. `appsecret_proof` Cryptographic Verification

-   **Formula**:
    $$\text{appsecret\_proof} = \text{HMAC-SHA256}(\text{AccessToken}, \text{AppSecret})$$
-   **Nodes updated**:
    -   [FacebookMessengerSend.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookMessengerSend/FacebookMessengerSend.ts)
    -   [FacebookPagePost.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookPagePost/FacebookPagePost.ts)
    -   [FacebookSend.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/FacebookSend.ts)
-   **Resolution Flow**:
    1. Checks for `appSecret` from credential (`facebookPageApi`) or dynamic variables (`overrideConfig.vars.facebookAppSecret` / `appSecret`).
    2. If present, calculates the HMAC-SHA256 hex digest and appends `params: { appsecret_proof: hash }` to the Meta Graph API request.
    3. If omitted, seamlessly falls back to standard Bearer token authentication without errors.
    4. Completely complies with Meta's **"Require App Secret for Server API calls"** security requirement.

---

### 2. Typing Indicator & Sender Actions

-   **New Action Selector**:
    -   `actionType`: `sendTextMessage` (default) vs `sendSenderAction` ("Sender Action / Typing Indicator").
-   **Sender Action Types**:
    -   `typing_on`: Displays animated typing bubbles in Facebook Messenger (active for up to 20 seconds or until the reply arrives).
    -   `mark_seen`: Marks the user's incoming message as read.
    -   `typing_off`: Explicitly turns off the typing indicator.
-   **Inline Typing Simulation**:
    -   When `actionType === 'sendTextMessage'`, an optional toggle `simulateTyping: true` with configurable `typingDelay` (seconds) sends `typing_on` right before dispatching the reply text.
-   **Supported in Both Dedicated & Combined Nodes**:
    -   [FacebookMessengerSend.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookMessengerSend/FacebookMessengerSend.ts)
    -   [FacebookSend.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/FacebookSend.ts) (`sendMessengerSenderAction`)

---

### 3. Updated Agentflow Template

-   **File**: [facebook_messenger_combined_agentflow.json](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/chatflows/facebook_messenger_combined_agentflow.json)
-   **Pipeline Architecture**:
    ```
    [ Start (Webhook Trigger) ]
                │
                ▼
    [ Facebook Typing Indicator (typing_on) ]  <-- Immediate visual feedback
                │
                ▼
    [ DevXHub Chatflow Brain (LLM/RAG) ]       <-- User sees typing bubbles while LLM thinks
                │
                ▼
    [ Facebook Send (Messenger Reply) ]        <-- Delivers response & dismisses indicator
                │
                ▼
    [ Direct Reply (Chat Confirmation) ]
    ```

---

## Verification Results

### Automated Unit Tests

All test suites passed cleanly:

1. **`FacebookMessengerSend.test.ts` (8 passed)**:

    ```bash
    PASS nodes/agentflow/FacebookMessengerSend/FacebookMessengerSend.test.ts
      FacebookMessengerSend Node
        ✓ should have correct node metadata
        ✓ should dispatch Messenger reply using recipient PSID without appSecret
        ✓ should calculate and pass appsecret_proof when appSecret is provided in credential
        ✓ should calculate and pass appsecret_proof when passed via overrideConfig.vars
        ✓ should dispatch typing_on sender action without message body
        ✓ should dispatch mark_seen sender action
        ✓ should dispatch typing indicator before message when simulateTyping is true
        ✓ should throw error when recipient PSID is missing
    ```

2. **`FacebookPagePost.test.ts` (4 passed)**:

    ```bash
    PASS nodes/agentflow/FacebookPagePost/FacebookPagePost.test.ts
      FacebookPagePost Node
        ✓ should have correct node metadata
        ✓ should publish post to Page feed without appSecret
        ✓ should calculate and pass appsecret_proof when appSecret is provided
        ✓ should throw error when message text is empty
    ```

3. **`FacebookSend.test.ts` (7 passed)**:
    ```bash
    PASS nodes/agentflow/FacebookSend/FacebookSend.test.ts
      FacebookSend Node (Combined)
        ✓ should have correct node metadata
        ✓ should send Messenger message when actionType is sendMessengerMessage
        ✓ should dispatch typing_on when actionType is sendMessengerSenderAction
        ✓ should calculate and attach appsecret_proof when appSecret is provided
        ✓ should publish post to Page feed when actionType is publishPagePost
        ✓ should throw error when recipient PSID is missing in Messenger mode
        ✓ should throw error when messageText is empty in sendMessengerMessage
    ```

### Build & Compilation

-   `pnpm --filter flowise-components build` successfully compiled all TypeScript files and copied assets into `dist/`.
