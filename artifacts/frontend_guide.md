# Frontend Guide — WhatsApp Agentic Flow Integration

Branch: `agentflow` (changes committed in `2b791fd04`). Server is API-only (headless) on this branch — `packages/ui/src` is NOT present here; the UI source lives on `main` (v3.1.4).

## 1. What the frontend gets for FREE (data-driven, no code needed)

The Flowise UI renders nodes/credentials/inputs dynamically from the server API. Nothing about the new integration requires new UI components:

| Feature                                           | Source of truth                                                                                | Auto-appears? |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------- |
| `WhatsAppSend` node in Agent Flows palette        | `GET /api/v1/nodes` (NodesPool from `packages/components/dist`)                                | Yes           |
| `WhatsAppCloudApi` credential in Credentials page | `GET /api/v1/credentials`, `GET /api/v1/components-credentials`                                | Yes           |
| `webhooksSessionId` input on Start node           | Start node `inputParams` (Start.ts) → `EditNodeDialog` → `NodeInputHandler`                    | Yes           |
| Node icon (`whatsapp.svg`)                        | `GET /api/v1/node-icon/whatsAppSendAgentflow` (server maps `icon: 'whatsapp.svg'` → dist path) | Yes           |
| Credential icon                                   | `GET /api/v1/components-credentials-icon/whatsAppCloudApi`                                     | Yes           |

**Only prerequisite:** `cd packages/components && pnpm build` so the new node/credential land in `dist` (already verified — `dist/nodes/agentflow/WhatsAppSend/` + `dist/credentials/WhatsAppCloudApi.credential.js` exist).

## 2. What main's UI ALREADY does (verify, don't rebuild)

These exist in the v3.1.4 UI on `main`:

1. **Webhook URL auto-fill** — `packages/ui/src/views/canvas/NodeInputHandler.jsx:843-844` and `:1146`:
    - For any input named `webhookURL`, shows a read-only field `POST https://<host>/api/v1/webhook/<chatflowId>`
    - Works for Agentflow V2 too — `views/agentflowsv2/EditNodeDialog.jsx:257` renders `NodeInputHandler`
    - So: save the flow once, then the Start node displays the exact URL to paste into Meta.
2. **Webhook secret Generate/Clear buttons** — `NodeInputHandler.jsx:181-215` (`handleSetWebhookSecret` / `handleClearWebhookSecret` → `POST /chatflows/:id/webhook-secret`). Only relevant if `webhookEnableAuth: true`.
3. **Webhook listener drawer (live monitoring)** — `views/webhooklistener/WebhookListenerDrawer.jsx` + `GET /api/v1/webhook-listener/:chatflowid/stream/:id` (SSE). Shows incoming messages + flow steps in real time.
4. **Flow import** — `views/agentflowsv2/Canvas.jsx:174-182` (`handleLoadFlow`): parses JSON, reads `.nodes` / `.edges`. The sample `artifacts/whatsapp_agentic_flow.json` (`{name, description, nodes, edges}`) is compatible.

## 3. What the frontend developer must DO on this branch

### A. Get a UI at all (this branch is headless)

-   `packages/ui` here contains only `build/` + `node_modules`; `packages/server/src/index.ts` serves no UI (root returns `{status:'OK', message:'...headless mode'}`).
-   **Option A (recommended for dev):** bring the UI source over from `main` (`git checkout main -- packages/ui`) then `cd packages/ui && pnpm install && pnpm build`.
-   **Option B:** serve the existing `packages/ui/build` statically (nginx/static server) pointing the API at `:3001` — the prebuilt bundle already contains the webhook listener drawer and webhook URL display (verified in `Canvas-*.js` assets).

### B. Verify with the checklist

1. Build components (node/credential auto-discovery).
2. Import `artifacts/whatsapp_agentic_flow.json` (Agent Flows → Import → paste file contents).
3. Save the flow → open Start node → copy the auto-filled **Webhook URL** (`POST …/api/v1/webhook/<flowId>`).
4. Credentials page → create **WhatsApp Cloud API** credential (accessToken + phoneNumberId), attach to the WhatsAppSend node.
5. Meta Developer Console → WhatsApp → Configuration → paste Callback URL + a Verify Token → **Verify and Save** (server echoes `hub.challenge` — verified: 200).
6. Open the Webhook Listener drawer, send a WhatsApp message → watch it flow through.
7. Echo mode: `messageText` = `{{ startAgentflow_0.output.content }}` → the message is echoed back via Graph API.

### C. Auth caveat (important)

`webhookEnableAuth` must stay **OFF** for WhatsApp — Meta webhook POSTs carry no signature header, so enabling auth 401s every message. The GET handshake still succeeds with auth off. If a future sender signs requests (GitHub/Stripe/Slack), auth on + HMAC works unchanged.

## 4. API contract the UI relies on (unchanged, verified)

-   `GET /api/v1/webhook/:id?...` — GET handshake path whitelisted (no auth)
-   `POST /api/v1/webhook/:id` — POST trigger path whitelisted (no auth)
-   `POST /api/v1/auth/register|login` — UI login works
-   `POST /api/v1/chatflows` (save), `GET /api/v1/chatflows` (list), `DELETE` — JWT authenticated
-   `GET /api/v1/executions?agentflowId=...` — execution history (sessionId = wa_id now stored correctly)
-   Per-sender memory: `sessionId` resolves from `{{ $webhook.body.entry[0].changes[0].value.messages[0].from }}` → stored in `overrideConfig.sessionId`
