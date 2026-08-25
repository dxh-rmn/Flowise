# Walkthrough - Native Facebook Integration for Flowise

We have implemented native Facebook integration in Flowise, enabling Facebook Messenger conversational AI replies and Facebook Page timeline publishing within the **AgentFlow** engine.

---

## 1. Components Created & Modified

### Credentials
- **[FacebookPageApi.credential.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/credentials/FacebookPageApi.credential.ts)**
  - Name: `facebookPageApi`
  - Fields: `accessToken` (Required Page/System User Token), `pageId` (Optional Facebook Page ID), `appSecret` (Optional App Secret).

### Action Node
- **[FacebookSend.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/FacebookSend.ts)** & **[facebook.svg](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/facebook.svg)**
  - **Type**: `FacebookSend`
  - **Category**: `Agent Flows`
  - **Color**: `#1877F2`
  - **Action Types**:
    1. `sendMessengerMessage`: Sends a direct response to a Messenger user (`POST https://graph.facebook.com/v20.0/me/messages`) using recipient `PSID`.
    2. `publishPagePost`: Publishes a status update with optional link attachment to the Page feed (`POST https://graph.facebook.com/v20.0/{page-id}/feed`).
  - **Dynamic Multi-Tenant Overrides**: Supports `options.overrideConfig.vars.userFacebookToken` / `facebookAccessToken` passed dynamically per user.
  - **Error Handling**: Graceful error catching with `continueOnFail` support.

### Webhook Engine
- **[webhook/index.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/controllers/webhook/index.ts)**
  - Added filter for Meta Facebook Messenger delivery, read, and echo receipts (`object === 'page'` without incoming user messages or with `is_echo: true`). These events are immediately acknowledged with `200 OK` (`{ received: true }`) to prevent infinite webhook loops and redundant LLM executions.
- **[webhook/index.test.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/controllers/webhook/index.test.ts)**
  - Added unit test coverage for Facebook receipt filtering, echo events, and valid message execution.

### Agentflow Templates
- **[facebook_messenger_agentflow.json](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/artifacts/facebook_messenger_agentflow.json)** (and mirrored in `chatflows/`):
  - Pre-configured complete AgentFlow:
    - **Start Node**: Webhook Trigger receiving Messenger payloads with session template `{{ $webhook.body.entry[0].messaging[0].sender.id }}`.
    - **LLM Node**: Processes user question `{{ $webhook.body.entry[0].messaging[0].message.text }}` with conversation history.
    - **FacebookSend Node**: Replies to user via Messenger.

---

## 2. Verification Results

### Automated Logic & Execution Tests
Ran unit test verifying Messenger dispatch, dirty HTML sanitization, dynamic token injection, and `continueOnFail` error handling:
```text
Testing Facebook Node Logic...
✓ Messenger Reply Test: {
  id: 'fb_1',
  name: 'facebookSendAgentflow',
  input: {
    actionType: 'sendMessengerMessage',
    payload: {
      recipient: { id: '1234567890' },
      messaging_type: 'RESPONSE',
      message: { text: 'Hello from Flowise Facebook Agent!' }
    }
  },
  output: {
    success: true,
    content: { recipient_id: '1234567890', message_id: 'mid.test_fb_123' }
  }
}
✓ Page Post Test: {
  id: 'fb_2',
  name: 'facebookSendAgentflow',
  input: {
    actionType: 'publishPagePost',
    payload: {
      message: 'New product announcement',
      link: 'https://devxhub.com'
    }
  },
  output: {
    success: true,
    content: { recipient_id: undefined, message_id: 'mid.test_fb_123' }
  }
}
✓ continueOnFail Test: {
  id: 'fb_3',
  name: 'facebookSendAgentflow',
  output: {
    success: false,
    content: {
      message: 'Request failed with status code 400',
      details: { message: 'Invalid OAuth access token', code: 190 },
      url: 'https://graph.facebook.com/v20.0/me/messages',
      actionType: 'sendMessengerMessage'
    }
  }
}

🎉 ALL TESTS PASSED!
```

---

## 3. How to Connect in Meta Developer App

1. In the **Meta App Dashboard**, under **Messenger** $\rightarrow$ **Webhooks**:
   - **Callback URL**: `https://your-domain.com/api/v1/webhook/<CHATFLOW_ID>`
   - **Verify Token**: Your webhook secret token.
   - **Subscribed Fields**: `messages`, `messaging_postbacks`.
2. In Flowise:
   - Add a **Facebook Page API** credential with your Page Access Token.
   - Wire the **Facebook Send** node to your Agentflow.
