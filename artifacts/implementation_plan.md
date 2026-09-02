# Restore Combined Facebook Send Node

The user requested to bring back the combined **Facebook Send** (`facebookSendAgentflow`) node which combines **Send Messenger Message** and **Publish Page Post** in a single node via an `actionType` toggle, while keeping the dedicated nodes (`FacebookMessengerSend` and `FacebookPagePost`) available as well.

## User Review Required

> [!NOTE]
> We will maintain backward compatibility so both options are available:
>
> 1. Combined node: **Facebook Send** (`FacebookSend` / `facebookSendAgentflow`) with `actionType` selection (Messenger reply or Page feed post).
> 2. Dedicated individual nodes: **Facebook Messenger Send** and **Facebook Page Post** for cleaner single-purpose workflows.

## Proposed Changes

### Components (`packages/components`)

#### [NEW] [`FacebookSend.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/FacebookSend.ts)

Restore the combined node class supporting:

-   Action Type: `Send Messenger Message` or `Publish Page Post`
-   Credential: `facebookPageApi`
-   Inputs dynamically shown based on action type (`recipientId`, `pageId`, `messageText`, `linkUrl`, `continueOnFail`)
-   Dynamic OAuth token resolution (`overrideConfig.vars.userFacebookToken`, etc.)

#### [NEW] [`FacebookSend.test.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/FacebookSend.test.ts)

Add comprehensive unit tests covering:

-   Node metadata verification
-   Messenger send execution
-   Page feed post execution
-   Validation errors (missing recipient, missing message)
-   `continueOnFail` error handling

#### [NEW] [`facebook.svg`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/FacebookSend/facebook.svg)

Add the Facebook icon for the node.

---

## Verification Plan

### Automated Tests

-   Run `pnpm test` on `packages/components/nodes/agentflow/FacebookSend/FacebookSend.test.ts`
-   Run `pnpm test` on `packages/components/nodes/agentflow/FacebookMessengerSend/FacebookMessengerSend.test.ts`
-   Run `pnpm test` on `packages/components/nodes/agentflow/FacebookPagePost/FacebookPagePost.test.ts`
-   Run `pnpm build` in `packages/components` to ensure TypeScript compilation passes.

### Manual Verification

-   Verify that Flowise recognizes `facebookSendAgentflow` as an available node under `Agent Flows`.
