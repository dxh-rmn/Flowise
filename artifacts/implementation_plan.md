# Split Facebook Nodes: Messenger Send & Page Post

Separate the monolithic `FacebookSend` node into two specialized nodes in Flowise Agent Flows:
1. **`FacebookMessengerSend`**: Dedicated to sending direct replies to Facebook Messenger users using Page-Scoped IDs (PSID).
2. **`FacebookPagePost`**: Dedicated to publishing updates, posts, and links to the Facebook Page feed / timeline.

Both nodes will share the existing [`FacebookPageApi.credential.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/credentials/FacebookPageApi.credential.ts) credential and support dynamic token resolution via `overrideConfig`.

---

## User Review Required

> [!NOTE]
> The single `FacebookSend` node will be replaced by two distinct nodes: `Facebook Messenger Send` and `Facebook Page Post`.
> Any existing chatflow templates using `FacebookSend` (such as [`facebook_messenger_agentflow.json`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/chatflows/facebook_messenger_agentflow.json)) will be updated to use the new `FacebookMessengerSend` node type.

---

## Proposed Changes

### Packages / Components Layer (`packages/components`)

#### [NEW] [FacebookMessengerSend.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookMessengerSend/FacebookMessengerSend.ts)
- **Node Label**: `Facebook Messenger Send`
- **Node Name**: `facebookMessengerSendAgentflow`
- **Type**: `FacebookMessengerSend`
- **Category**: `Agent Flows`
- **Color**: `#0084FF` (Messenger Blue)
- **Icon**: `messenger.svg`
- **Credential**: `facebookPageApi` (optional, supports dynamic tokens)
- **Inputs**:
  - `recipientId`: Recipient PSID (default: `{{ $webhook.body.entry[0].messaging[0].sender.id }}`)
  - `messageText`: Message Text
  - `continueOnFail`: Continue on API error (default: `false`)
- **Execution (`run`)**:
  - Dispatches POST to `https://graph.facebook.com/v20.0/me/messages`
  - Payload: `{ recipient: { id: recipient }, messaging_type: 'RESPONSE', message: { text: messageText } }`

#### [NEW] [messenger.svg](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookMessengerSend/messenger.svg)
- Vector icon for Facebook Messenger.

---

#### [NEW] [FacebookPagePost.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookPagePost/FacebookPagePost.ts)
- **Node Label**: `Facebook Page Post`
- **Node Name**: `facebookPagePostAgentflow`
- **Type**: `FacebookPagePost`
- **Category**: `Agent Flows`
- **Color**: `#1877F2` (Facebook Blue)
- **Icon**: `facebook.svg`
- **Credential**: `facebookPageApi`
- **Inputs**:
  - `pageId`: Facebook Page ID (optional, defaults to Page ID from credential or `me`)
  - `messageText`: Post Content
  - `linkUrl`: Optional link URL attached to the post
  - `continueOnFail`: Continue on API error (default: `false`)
- **Execution (`run`)**:
  - Dispatches POST to `https://graph.facebook.com/v20.0/${pageId}/feed`
  - Payload: `{ message: messageText, ...(linkUrl ? { link: linkUrl } : {}) }`

#### [NEW] [facebook.svg](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookPagePost/facebook.svg)
- Vector icon for Facebook Page.

---

#### [DELETE] [FacebookSend/](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/)
- Remove the deprecated unified node directory.

---

### Templates & Documentation

#### [MODIFY] [facebook_messenger_agentflow.json](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/chatflows/facebook_messenger_agentflow.json)
- Update the sample flow to reference `FacebookMessengerSend` node type, anchors, and inputs.

---

## Verification Plan

### Automated Verification
1. **TypeScript Compilation**:
   ```bash
   pnpm --filter @flowiseai/components build
   ```
2. **Unit Test / Execution Verification**:
   - Run tests to ensure node definitions load and execute properly.

### Manual Verification
- Verify both `Facebook Messenger Send` and `Facebook Page Post` appear under **Agent Flows** in Flowise visual palette.
- Verify clean, focused parameter inputs on each node.
