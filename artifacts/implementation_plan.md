# Implementation Plan - Native Facebook Integration for Flowise

This plan focuses **exclusively on integrating Facebook** (Facebook Messenger & Facebook Page Posts) into the Flowise AgentFlow system.

---

## User Review Required

> [!IMPORTANT]
> **Meta Webhook & Access Token Requirements**:
> - **Messenger Replies** use the recipient's Page-Scoped ID (`PSID`) via `POST https://graph.facebook.com/v20.0/me/messages`.
> - **Page Posts** publish directly to the Page timeline via `POST https://graph.facebook.com/v20.0/{page-id}/feed`.
> - Both can use a static `facebookPageApi` credential or accept dynamic user tokens at runtime via `options.overrideConfig.vars.userFacebookToken`.

> [!NOTE]
> Facebook sends delivery & read receipt events (like `delivery` and `read` objects without a `message` object). The webhook controller will filter these echo receipts and immediately respond with HTTP 200 to prevent infinite loops (matching the pattern we implemented for WhatsApp).

---

## Proposed Changes

### 1. Credentials (`packages/components/credentials`)

#### [NEW] [FacebookPageApi.credential.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/credentials/FacebookPageApi.credential.ts)
- **Credential Name**: `facebookPageApi`
- **Fields**:
  - `accessToken` (Password, Required): Meta Facebook Page Access Token or System User Token.
  - `pageId` (String, Optional): Facebook Page ID (used for Page Feed publishing).
  - `appSecret` (Password, Optional): Meta App Secret (for `appsecret_proof` hash security).

---

### 2. Action Node (`packages/components/nodes/agentflow/FacebookSend`)

#### [NEW] [FacebookSend.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/FacebookSend.ts)
- **Category**: `Agent Flows`
- **Icon**: `facebook.svg`
- **Color**: `#1877F2`
- **Inputs**:
  - `actionType` (Options):
    - `sendMessengerMessage` (Default): Sends a direct reply to a user on Facebook Messenger.
    - `publishPagePost`: Publishes a status update or announcement to the Facebook Page feed.
  - `recipientId` (String, acceptVariable):
    - Default: `{{ $webhook.body.entry[0].messaging[0].sender.id }}`
    - Description: Recipient PSID (Page-Scoped ID) for Messenger replies.
  - `messageText` (String, textarea, acceptVariable): Message or post content to publish.
  - `linkUrl` (String, optional, acceptVariable): Optional URL attachment for Page Posts.
- **Execution Logic**:
  - Resolves token: `options.overrideConfig?.vars?.userFacebookToken` $\rightarrow$ fallback to `credentialData.accessToken`.
  - Executes `axios.post` to Meta Graph API v20.0.
  - Catches Meta API error codes (e.g. Code 190 invalid token, Code 100 invalid PSID) and returns a clean error payload rather than crashing the flow.

#### [NEW] [facebook.svg](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/facebook.svg)
- Official Facebook SVG icon for the Flowise canvas node.

---

### 3. Webhook Controller Enhancement (`packages/server/src/controllers/webhook`)

#### [MODIFY] [webhook/index.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/controllers/webhook/index.ts)
- Add receipt filtering for inbound Facebook Webhooks (`object === 'page'`):
  - If a webhook payload is a delivery confirmation, read receipt, or echo without `message.text`, immediately return `res.status(200).json({ received: true })` to prevent redundant flow runs.

#### [MODIFY] [webhook/index.test.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/controllers/webhook/index.test.ts)
- Add unit tests verifying Facebook receipt filtering and `200 OK` response.

---

### 4. Agentflow Template (`artifacts/` & `chatflows/`)

#### [NEW] [facebook_messenger_agentflow.json](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/artifacts/facebook_messenger_agentflow.json)
- Pre-configured complete AgentFlow template:
  1. **Start Node**: Configured as Meta Webhook Trigger with session ID `{{ $webhook.body.entry[0].messaging[0].sender.id }}`.
  2. **LLM / Knowledge Retrieval Node**: Ingests `{{ $webhook.body.entry[0].messaging[0].message.text }}` and generates contextual response with conversation memory.
  3. **FacebookSend Node**: Dispatches reply back to user via Messenger.

---

## Verification Plan

### Automated Tests
1. **Node Registration & Build**:
   ```bash
   pnpm --filter flowise-components build
   pnpm --filter flowise build
   ```
2. **Facebook Webhook Controller Unit Tests**:
   ```bash
   pnpm --filter flowise test src/controllers/webhook/index.test.ts
   ```
3. **Execution & Mock Graph API Test**:
   - Run unit test simulating `FacebookSend` node dispatching Messenger replies and Page Posts with mocked Axios Graph API responses.

### Manual Verification
- Verify `facebookPageApi` shows in Flowise Credentials menu.
- Verify `FacebookSend` node appears under **Agent Flows** in the Flowise visual canvas.
