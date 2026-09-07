# Implementation Plan: Facebook Enhancements & LinkedIn Integration

This plan unifies the implementation details for both the **Facebook Enhancements** (typing indicators, sender actions, and `appsecret_proof`) and the **LinkedIn Social Integration** (`LinkedInPost`, `LinkedInComment`, and `LinkedInApi`).

---

## 1. Facebook Enhancements

### Security & Messenger UX

1. **`appsecret_proof` Cryptographic Verification**:
    - Automatically computed via HMAC-SHA256 (`crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex')`) and passed as query parameter to Meta Graph API.
    - Mitigates token hijacking risks on `FacebookMessengerSend`, `FacebookPagePost`, and `FacebookSend`.
2. **Typing Indicators & Read Receipts**:
    - `typing_on`: Displays typing bubbles in Messenger for immediate feedback while agents process requests.
    - `mark_seen`: Marks incoming messages as read.
    - `typing_off`: Explicitly dismisses typing bubbles.
    - `simulateTyping` & `typingDelay`: Inline simulation option directly on message nodes.

---

## 2. LinkedIn Channel Integration

### Social Publishing & Company Commenting

1. **`LinkedInApi` Credential**:
    - `linkedInApi`: OAuth 2.0 Bearer access token (`w_member_social`, `w_organization_social`), Author Type (`Personal Profile` vs `Company / Organization Page`), and Organization ID.
2. **`LinkedInPost` Node**:
    - Publishes commentary and article preview cards to Personal Profiles or Company Pages via `POST /rest/posts`.
    - Auto-resolves personal Member URN via `/v2/userinfo`.
3. **`LinkedInComment` Node**:
    - Publishes comments and replies to threaded discussions on posts as a LinkedIn Organization (`POST /rest/socialActions/{targetUrn}/comments`).
4. **Server Webhook Integration**:
    - Webhook controller filtering for LinkedIn challenge/echo events.

---

## Verification Plan

### Automated Tests

1. **Facebook Component Tests**:
    ```bash
    NODE_OPTIONS="--max-old-space-size=4096" pnpm --filter flowise-components exec jest \
      nodes/agentflow/FacebookMessengerSend \
      nodes/agentflow/FacebookPagePost \
      nodes/agentflow/FacebookSend
    ```
2. **LinkedIn Component Tests**:
    ```bash
    NODE_OPTIONS="--max-old-space-size=4096" pnpm --filter flowise-components exec jest \
      nodes/agentflow/LinkedInPost \
      nodes/agentflow/LinkedInComment
    ```
3. **Compilation**:
    ```bash
    pnpm --filter flowise-components build
    ```
