# Walkthrough: LinkedIn Post & Organization Comment Integration in Flowise Agentflow

We expanded the **LinkedIn integration** on the `linkedin-integration` branch with both post publishing and organization comment automation capabilities:

1. **`LinkedInPost`**: Publish updates, articles, and thought leadership to Company Pages and Personal Profiles.
2. **`LinkedInComment`**: Post top-level comments or reply to threaded comments on posts as a LinkedIn Company / Organization Page.

---

## What Was Implemented

### 1. `LinkedInApi` Credential

-   **File**: [`LinkedInApi.credential.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/credentials/LinkedInApi.credential.ts)
-   **Credential Name**: `linkedInApi`
-   **Fields**:
    -   `accessToken`: LinkedIn OAuth 2.0 Bearer access token (`w_organization_social`, `w_member_social`).
    -   `authorType`: Defaults to `Company / Organization Page` or `Personal Profile`.
    -   `organizationId`: Numeric Organization ID (e.g. `12345678`).
    -   `personUrn`: Optional personal Member URN.

### 2. `LinkedInPost` Agentflow Node

-   **File**: [`LinkedInPost.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/LinkedInPost/LinkedInPost.ts)
-   **Node Identifier**: `linkedInPostAgentflow`
-   **Category**: `Agent Flows`
-   **Color**: `#0A66C2`
-   **Icon**: [`linkedin.svg`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/LinkedInPost/linkedin.svg)
-   **Capabilities**:
    -   Publish to Company Pages (`urn:li:organization:...`) or Personal Profiles (`urn:li:person:...`).
    -   Article / link card previews with optional custom title and description.
    -   Auto-resolves personal Member URN via `/v2/userinfo`.
    -   Visibility control (`PUBLIC` vs `CONNECTIONS`).

### 3. `LinkedInComment` Agentflow Node (NEW)

-   **File**: [`LinkedInComment.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/LinkedInComment/LinkedInComment.ts)
-   **Node Identifier**: `linkedInCommentAgentflow`
-   **Category**: `Agent Flows`
-   **Color**: `#0A66C2`
-   **Icon**: [`linkedin.svg`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/LinkedInComment/linkedin.svg)
-   **Capabilities**:
    -   **Organization Commenting**: Post comments representing your Company / Organization Page (`actor: urn:li:organization:{id}`).
    -   **Top-Level Post Comments**: Comment directly on any LinkedIn post URN or post URL (`POST /rest/socialActions/{targetUrn}/comments`).
    -   **Threaded Comment Replies**: Reply directly to specific user comments via `parentCommentUrn`.
    -   **Smart Target Parsing**: Automatically converts post URLs (e.g. `https://www.linkedin.com/feed/update/urn:li:activity:1234...`) or raw IDs into valid, encoded target URNs.
    -   **Resilient Execution**: `continueOnFail` flag to handle permission or API errors without crashing workflows.

### 4. Automated Unit Test Suites

-   **LinkedInPost Tests**: [`LinkedInPost.test.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/LinkedInPost/LinkedInPost.test.ts) (7 / 7 tests passed)
-   **LinkedInComment Tests**: [`LinkedInComment.test.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/LinkedInComment/LinkedInComment.test.ts) (8 / 8 tests passed)

### 5. Chatflow Templates & Guides

-   **Post Template**: [`chatflows/linkedin_post_agentflow.json`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/chatflows/linkedin_post_agentflow.json)
-   **Org Comment Template**: [`chatflows/linkedin_org_comment_agentflow.json`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/chatflows/linkedin_org_comment_agentflow.json)
-   **Setup Guide**: [`artifacts/linkedin_integration_guide.md`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/artifacts/linkedin_integration_guide.md)

---

## Verification Results

### 1. Automated Jest Unit Tests

```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm --filter flowise-components exec jest \
  nodes/agentflow/LinkedInPost \
  nodes/agentflow/LinkedInComment
```

**Result**:

-   `PASS nodes/agentflow/LinkedInPost/LinkedInPost.test.ts` (7 / 7 passed)
-   `PASS nodes/agentflow/LinkedInComment/LinkedInComment.test.ts` (8 / 8 passed)
-   **15 / 15 tests passed (100% pass rate)**.

### 2. Build Compilation

```bash
pnpm --filter flowise-components build
```

**Result**:

-   Compiled `packages/components/dist/nodes/agentflow/LinkedInPost/`
-   Compiled `packages/components/dist/nodes/agentflow/LinkedInComment/`
-   Compiled `packages/components/dist/credentials/LinkedInApi.credential.js`
