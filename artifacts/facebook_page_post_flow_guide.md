# Facebook Page Post Agent Flow Guide

This guide explains the architecture, configuration, and execution of the **Facebook Page Post Agent** flow in Flowise.

---

## 1. Flow Overview

The flow is configured as an **Agentflow V2** that lets you create and publish Facebook Page posts through the interactive chat interface (or via API/Webhook).

### Architecture Diagram

```
[ Start (Chat Input) ]
         │
         ▼
[ Facebook Copywriter (LLM) ]
         │
         ▼
[ Facebook Page Post (Meta Graph API) ]
         │
         ▼
[ Direct Reply (Chat Confirmation) ]
```

---

## 2. Nodes Configuration

### Node 1: Start (`startAgentflow_0`)

-   **Type**: `Start`
-   **Input Type**: `Chat Input` (`chatInput`)
-   **Description**: Receives the topic, announcement, or prompt from the user in chat.

### Node 2: Facebook Copywriter (`llmAgentflow_0`)

-   **Type**: `LLM`
-   **Model**: `chatGoogleGenerativeAI` (Google Gemini)
-   **Credential**: Uses your existing `googleGenerativeAI` credential (`devxhub test`)
-   **Prompt**:
    -   Automatically structures your topic into a high-engagement post with an eye-catching hook, clean body text, call-to-action (CTA), emojis, and relevant hashtags.
    -   **Verbatim Mode**: If you start your prompt with `Post verbatim:` or `Post this exact text:`, it will publish your exact text without any modifications.

### Node 3: Facebook Page Post (`facebookPagePostAgentflow_0`)

-   **Type**: `FacebookPagePost`
-   **Inputs**:
    -   `pageId`: `me` (or your specific Facebook Page ID numeric string)
    -   `messageText`: `{{llmAgentflow_0.output.content}}`
    -   `continueOnFail`: `true` (catches API errors gracefully)
-   **Endpoint**: `POST https://graph.facebook.com/v20.0/{pageId}/feed`

### Node 4: Direct Reply (`directReplyAgentflow_0`)

-   **Type**: `DirectReply`
-   **Output**: Returns a formatted message in chat with:
    -   Published post preview
    -   Meta Facebook Post ID (`{{facebookPagePostAgentflow_0.output.content.id}}`)

---

## 3. Credential Setup

To allow the node to publish to your Facebook Page, you need a Facebook Page Access Token from Meta Developer Console.

### Step 1: Obtain Page Access Token

1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Open your App (or create a Business App).
3. Under **Graph API Explorer**:
    - Select your Facebook Page in the **User or Page** dropdown.
    - Request permissions:
        - `pages_show_list`
        - `pages_read_engagement`
        - `pages_manage_posts`
    - Generate the **Page Access Token**.

### Step 2: Add Credential to Flowise

1. Open Flowise UI (`http://localhost:3000` or `http://localhost:3001`).
2. Navigate to **Credentials** -> **Add Credential**.
3. Select **Facebook Page API**.
4. Fill in:
    - **Page Access Token**: Your token from Step 1.
    - **Page ID**: Your Facebook Page ID (numeric) or leave blank for `me`.
5. Save the credential.
6. Open the **Facebook Page Post Agent** flow and attach this credential to the **Facebook Page Post** node.

---

## 4. How to Run & Test

1. Open the **Facebook Page Post Agent** from your Agentflows list.
2. Click the chat icon on the top right.
3. Send any prompt, for example:
    > _"Announce our new AI Agent platform launch with a 20% early-bird discount on DevXHub.com"_
4. The LLM will compose the post, the Facebook Page Post node will publish it to your Page feed, and you will receive the confirmation with the Facebook Post ID!
