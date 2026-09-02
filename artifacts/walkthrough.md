# Walkthrough: Restored Combined Facebook Send Node

We restored the combined **Facebook Send** (`facebookSendAgentflow`) node in Flowise Agentflow while retaining the dedicated `FacebookMessengerSend` and `FacebookPagePost` nodes, providing full flexibility for both unified and single-purpose workflows.

---

## Changes Made

### 1. Re-added Combined Facebook Send Node

-   **Component**: [`FacebookSend.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/FacebookSend.ts)
-   **Node Identifier**: `facebookSendAgentflow`
-   **Icon**: [`facebook.svg`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/facebook.svg)
-   **Features**:
    -   **Action Type Selector**:
        -   `Send Messenger Message`: Dispatches DM replies via `POST https://graph.facebook.com/v20.0/me/messages` using `recipientId` (PSID).
        -   `Publish Page Post`: Publishes updates/links to the Page feed via `POST https://graph.facebook.com/v20.0/{pageId}/feed`.
    -   **Credential**: Uses `facebookPageApi` credential.
    -   **Dynamic Multi-tenant Support**: Supports dynamic tokens passed via `overrideConfig.vars.userFacebookToken`.
    -   **Graceful Error Handling**: `continueOnFail` flag to return API errors in node output rather than crashing the flow.

### 2. Comprehensive Test Suite

-   Created [`FacebookSend.test.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/FacebookSend.test.ts) covering:
    -   Node metadata verification
    -   Messenger send execution
    -   Page feed post execution
    -   Validation checks for recipient and message text

---

## Verification Results

### Automated Unit Tests

#### 1. Combined `FacebookSend` Test Suite

```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm --filter flowise-components exec jest nodes/agentflow/FacebookSend/FacebookSend.test.ts
```

**Result**:

-   `PASS nodes/agentflow/FacebookSend/FacebookSend.test.ts`
-   5 tests passed (100% pass rate).

#### 2. Dedicated Nodes Test Suites

```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm --filter flowise-components exec jest nodes/agentflow/FacebookMessengerSend/FacebookMessengerSend.test.ts nodes/agentflow/FacebookPagePost/FacebookPagePost.test.ts
```

**Result**:

-   `PASS nodes/agentflow/FacebookMessengerSend/FacebookMessengerSend.test.ts` (3 tests passed)
-   `PASS nodes/agentflow/FacebookPagePost/FacebookPagePost.test.ts` (3 tests passed)
-   6 tests passed (100% pass rate).

### Build Verification

Compiled via `pnpm --filter flowise-components build`:

-   `packages/components/dist/nodes/agentflow/FacebookSend/FacebookSend.js` generated and ready for runtime loading.

---

## Summary of Available Facebook Agentflow Nodes

| Node Name                   | Node Type               | Use Case                                                                       |
| --------------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| **Facebook Send**           | `FacebookSend`          | Combined node: Switch between Messenger DM and Page Feed post in a single node |
| **Facebook Messenger Send** | `FacebookMessengerSend` | Dedicated node: Inbound/outbound Facebook Messenger bot replies                |
| **Facebook Page Post**      | `FacebookPagePost`      | Dedicated node: Automated Facebook Page feed publishing                        |
