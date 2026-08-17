# Flow-Native WhatsApp Integration (Option A Implementation Plan)

## Goal

Implement a **Flow-Native WhatsApp Integration** for Flowise Agentflows & Chatflows. This uses a self-contained component node pattern (`WhatsAppCloudApi` credential + `WhatsAppSend` node + `GET hub.challenge` webhook handshake) without modifying core server database schemas.

---

## User Design Choices Confirmed

| Choice                | Decision                                | Rationale                                                                         |
| :-------------------- | :-------------------------------------- | :-------------------------------------------------------------------------------- |
| **Architecture**      | **Option A (`flow-native`)**            | Fits standard Flowise & n8n node paradigm; zero DB migrations.                    |
| **Reply Dispatch**    | **In-Flow Send Node**                   | Visible `WhatsAppSend` node on the canvas for full control & branching.           |
| **Memory / Session**  | **Per-Sender Memory**                   | `sessionId = wa_id` (phone number) for persistent multi-turn AI context.          |
| **Scope for v1**      | **Text-Only v1**                        | Fast delivery for text interactions; non-text messages return fallback notice.    |
| **Meta Verification** | **GET Handshake in Webhook Controller** | Echoes `hub.challenge` automatically so Meta validates the webhook URL instantly. |

---

## Proposed Changes

### Component Layer (`packages/components`)

#### [NEW] [WhatsAppCloudApi.credential.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/credentials/WhatsAppCloudApi.credential.ts)

-   Defines credential fields required for Meta WhatsApp Cloud API:
    -   `accessToken` (Meta Graph API Permanent/Temporary System User Access Token)
    -   `phoneNumberId` (WhatsApp Business Phone Number ID)

#### [NEW] [WhatsAppSend.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/WhatsAppSend/WhatsAppSend.ts)

-   Canvas node that sends text responses back to the sender via Meta Graph API:
    -   `inputs`:
        -   `credential`: `WhatsAppCloudApi` credential
        -   `recipient`: Default `{{ $webhook.body.entry[0].changes[0].value.messages[0].from }}`
        -   `message`: Default `{{ <agentId>.output.content }}`
    -   Sends HTTP POST request to `https://graph.facebook.com/v20.0/{phoneNumberId}/messages`

#### [MODIFY] [Start.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/Start/Start.ts)

-   Add `webhooksSessionId` input field (`acceptVariable: true`) so users can configure `sessionId = {{ $webhook.body.entry[0].changes[0].value.messages[0].from }}`.

---

### Backend Server Layer (`packages/server`)

#### [MODIFY] [webhook/index.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/controllers/webhook/index.ts)

-   Add HTTP `GET` handler for Meta verification:
    -   Validates `hub.mode === 'subscribe'` and `hub.verify_token === webhookSecret`.
    -   Echoes back `hub.challenge` as plain text (`res.status(200).send(hub.challenge)`).
-   Resolve `webhooksSessionId` from incoming JSON payload template so `req.body.sessionId` is set automatically to the sender's phone number (`wa_id`).

#### [MODIFY] [buildAgentflow.ts](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/utils/buildAgentflow.ts)

-   Export `resolveWebhookRefs` helper to resolve dynamic `$webhook.body...` references during flow execution.

---

### Artifacts & Sample Flow

#### [NEW] [whatsapp_agentic_flow.json](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/artifacts/whatsapp_agentic_flow.json)

-   Sample importable Agentflow template connecting:
    -   `Start Node` (Webhook trigger, `sessionId = wa_id`) $\rightarrow$ `Agent Node` $\rightarrow$ `WhatsAppSend Node`.

---

## Verification Plan

### Automated Build Verification

```bash
# Build component nodes
cd packages/components && pnpm build

# Compile server TypeScript
cd packages/server && pnpm build
```

### Manual & API Verification

1. **GET Handshake Test**:
    ```bash
    curl -i "http://localhost:3000/api/v1/webhook/<flowId>?hub.mode=subscribe&hub.verify_token=<secret>&hub.challenge=123456789"
    # Expect: HTTP 200 with body "123456789"
    ```
2. **Inbound Message Simulation**:
    ```bash
    curl -X POST "http://localhost:3000/api/v1/webhook/<flowId>" \
      -H "Content-Type: application/json" \
      -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"15551234567","text":{"body":"Hello AI"}}]}}]}]}'
    ```
