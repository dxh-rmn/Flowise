# n8n vs. Flowise: Corrected Feature Gap Analysis

> **⚠️ CORRECTED VERSION** — After a thorough codebase audit, several items previously listed as "missing" in Flowise **already exist**. This document has been updated to reflect the actual state of the codebase.

---

## ✅ What Flowise ALREADY HAS (Previously Listed as Missing)

### 1. Cron / Interval Scheduler — ✅ FULLY BUILT

Previously claimed missing. **Actually exists as a complete, production-grade system:**

| Component                     | File                                                                                                                                              | What It Does                                                                                               |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------- |
| **ScheduleBeat Engine**       | [`ScheduleBeat.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/schedule/ScheduleBeat.ts)                      | Singleton cron orchestrator. Supports **node-cron** (single instance) and **BullMQ** (distributed/HA mode) |
| **ScheduleExecutor**          | [`ScheduleExecutor.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/schedule/ScheduleExecutor.ts)              | Executes scheduled flows, logs results to ScheduleTriggerLog                                               |
| **ScheduleRecord Entity**     | [`ScheduleRecord.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/database/entities/ScheduleRecord.ts)         | DB entity: cronExpression, timezone, enabled, lastRunAt, nextRunAt, endDate                                |
| **ScheduleTriggerLog Entity** | [`ScheduleTriggerLog.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/database/entities/ScheduleTriggerLog.ts) | Execution history with status, duration, error tracking                                                    |
| **Schedule Service**          | [`services/schedule/index.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/services/schedule/index.ts)         | Full CRUD, toggle enable/disable, paginated trigger logs, batch processing                                 |
| **Start Node Config**         | [`Start.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/components/nodes/agentflow/Start/Start.ts)                       | `scheduleInput` type with **Visual Picker** (hourly/daily/weekly/monthly) AND **Cron Expression**          |
| **Schedule UI**               | [`views/schedule/`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/ui/src/views/schedule)                                    | ScheduleHistoryDrawer + ScheduleHistoryFAB                                                                 |

---

### 2. Webhook Trigger with Signature Verification — ✅ FULLY BUILT

Previously claimed Flowise only had "1 generic webhook endpoint." **Actually has a rich, configurable webhook trigger system:**

| Feature                        | Details                                                                                               |
| :----------------------------- | :---------------------------------------------------------------------------------------------------- |
| **Start Node Webhook Trigger** | `startInputType: 'webhookTrigger'` with full config                                                   |
| **HTTP Methods**               | GET, POST, PUT, PATCH, DELETE                                                                         |
| **Signature Verification**     | HMAC-SHA256 and Plain Token — supports **GitHub, Stripe, Slack, GitLab** webhook signatures           |
| **Response Modes**             | Synchronous, Asynchronous (with callback URL + secret), Streaming (SSE)                               |
| **Request Validation**         | Define expected query params, body params (typed), and headers with required flags                    |
| **Content Types**              | `application/json` and `application/x-www-form-urlencoded` (auto-parses GitHub-style `payload` field) |
| **Template Variables**         | `{{ $webhook.body.* }}`, `{{ $webhook.headers.* }}`, `{{ $webhook.query.* }}`                         |

---

### 3. Form Input / Approval Pages — ✅ PARTIALLY BUILT

| Feature                         | Status                                                                                                    |
| :------------------------------ | :-------------------------------------------------------------------------------------------------------- |
| **Form Trigger**                | ✅ `startInputType: 'formInput'` with title, description, typed fields (string, number, boolean, options) |
| **Human Input Node**            | ✅ Pauses flow execution, waits for user input                                                            |
| **Standalone Public Form Page** | ❌ Not yet — forms are embedded in chat, not served as standalone web pages                               |

---

### 4. Global Environment Variables — ✅ FULLY BUILT

Previously claimed Flowise uses `.env` requiring server restarts. **Actually has a full dynamic Variables system:**

| Component             | File                                                                                                                                                           |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Variable Entity**   | [`Variable.ts`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/server/src/database/entities/Variable.ts) — name, value, type, workspaceId |
| **Variables API**     | Full CRUD via `/api/v1/variables`                                                                                                                              |
| **Variables UI**      | [`views/variables/`](file:///media/rumon/PLANT/devxhub/workflow%20agent/Flowise/packages/ui/src/views/variables) — Add/Edit dialog + "How to Use" guide        |
| **No restart needed** | Variables are stored in DB, not `.env`                                                                                                                         |

---

### 5. SaaS Tool Integrations — ✅ MORE THAN EXPECTED (40+ Nodes)

Previously claimed Flowise only had generic HTTP. **Actually has 20+ dedicated SaaS tool nodes + MCP servers:**

| Category         | Built-in Tool Nodes                                                                                                                            |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **Google Suite** | Gmail (drafts, messages, labels, threads), Google Calendar, Google Docs, Google Drive, Google Sheets, Google Search API                        |
| **Microsoft**    | Microsoft Outlook, Microsoft Teams                                                                                                             |
| **Dev Tools**    | Jira, GitHub (MCP)                                                                                                                             |
| **Payments**     | Stripe                                                                                                                                         |
| **AWS**          | AWS SNS, AWS DynamoDB KV Storage                                                                                                               |
| **Search**       | Brave Search, Exa Search, SerpAPI, Serper, Tavily, Searxng, WolframAlpha                                                                       |
| **Web**          | Web Browser, Web Scraper, Arxiv                                                                                                                |
| **Code**         | Code Interpreter (E2B), Custom Tool (JS/Python)                                                                                                |
| **MCP Servers**  | Slack MCP, GitHub MCP, PostgreSQL MCP, Brave Search MCP, Browserless MCP, Teradata MCP, Sequential Thinking MCP, Custom MCP, **Pipedream MCP** |

> [!IMPORTANT] > **Pipedream MCP** is a game-changer — it connects Flowise to **400+ SaaS apps** (Salesforce, HubSpot, Notion, Linear, Asana, etc.) via Pipedream's MCP bridge. This largely closes the gap with n8n's 400+ connector library.

---

## ❌ What is GENUINELY Still Missing (Corrected List)

### Sequence 1: Advanced Trigger & Event Patterns

| #       | Feature                           | What n8n Has                                                                                                                                         | Flowise Status                                                                                                                                                    |
| ------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.1** | **Polling Trigger Engine**        | Background worker that periodically polls external APIs (new DB rows, RSS feeds) with `lastPolledTimestamp` cursor to only trigger on **new** items. | ❌ Missing. Flowise has cron-triggered flows, but no built-in polling-with-cursor engine for external data sources.                                               |
| **1.2** | **App-Specific Webhook Triggers** | Pre-built triggers for GitHub, Stripe, Shopify, etc. that auto-register webhook URLs with the provider and parse platform-specific payloads.         | ⚠️ Partial. Flowise webhook supports GitHub/Stripe/Slack signature verification, but doesn't auto-register webhooks or provide platform-specific payload parsers. |

---

### Sequence 2: Data & ETL Engine

| #       | Feature                             | What n8n Has                                                                                              | Flowise Status                                                                        |
| ------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **2.1** | **Item-Based (Array) Batch Engine** | If 50 records enter a node, the node processes all 50 automatically without manual loops.                 | ❌ Missing. Flowise operates on single payloads; requires `Loop` / `Iteration` nodes. |
| **2.2** | **Merge Node**                      | Combines data from 2+ branches: append, SQL-like join, choose-branch.                                     | ❌ Missing. No visual node to merge parallel branch outputs.                          |
| **2.3** | **Data Cleaning Nodes**             | Visual no-code nodes: Filter, Remove Duplicates, Sort and Limit, Split in Batches.                        | ❌ Missing. Must be hand-coded in `Custom Function` (JavaScript).                     |
| **2.4** | **Binary & File Pipeline**          | Dedicated binary data stream: Read/write S3, parse `.xlsx` / `.csv`, extract text from PDF, compress ZIP. | ❌ Missing. File handling is only at the Document Loader / chat upload level.         |

---

### Sequence 3: Plugin Architecture

| #       | Feature                           | What n8n Has                                                                               | Flowise Status                                                                                                |
| ------- | --------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **3.1** | **Universal OAuth2 Auto-Refresh** | Centralized engine that auto-refreshes OAuth2 tokens in the background before they expire. | ❌ Missing. OAuth2 credentials exist but no automatic token refresh scheduling.                               |
| **3.2** | **Modular Node Plugin System**    | Developers publish independent npm packages (`n8n-nodes-*`) that install dynamically.      | ❌ Missing. Flowise nodes are bundled in `packages/components`. Community nodes require source modifications. |

---

### Sequence 4: Reliability & Workflow Ops

| #       | Feature                      | What n8n Has                                                                                                      | Flowise Status                                                |
| ------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **4.1** | **Node-Level Auto-Retry**    | Configurable per-node: Retry on Fail (N times, exponential backoff) + Continue on Fail (pass fallback data).      | ❌ Missing. If a node fails, the entire execution terminates. |
| **4.2** | **Global Error Workflows**   | Link an Error Workflow to any flow. When any step crashes, the error flow fires automatically (e.g. Slack alert). | ❌ Missing. No fallback error-flow routing.                   |
| **4.3** | **Canvas Node Data Pinning** | Click "Pin Data" on any node output. Test downstream nodes without re-executing upstream nodes.                   | ❌ Missing. Must re-run from Start node every time.           |

---

### Sequence 5: Workflow Lifecycle

| #       | Feature                             | What n8n Has                                                                                                                      | Flowise Status                                                                              |
| ------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **5.1** | **Standalone Public Form Pages**    | Form Trigger auto-generates a styled web form. Wait for Form pauses flow and serves an approval page with Approve/Reject buttons. | ⚠️ Partial. Form Input exists but renders in chat, not as a standalone public URL/web page. |
| **5.2** | **Workflow Versioning & Rollbacks** | Full version history with visual diffs and 1-click rollback.                                                                      | ❌ Missing. Flowise saves current state only.                                               |

---

## Summary: Actual Gap Count

| Status                   | Count | Items                                                                                                                                                                                               |
| :----------------------- | :---- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ **Already Built**     | 5     | Cron Scheduler, Webhook Triggers, Form Inputs, Global Variables, 20+ SaaS Tools + Pipedream MCP                                                                                                     |
| ⚠️ **Partially Built**   | 2     | App-Specific Webhook Parsers, Standalone Form Pages                                                                                                                                                 |
| ❌ **Genuinely Missing** | 9     | Polling Engine, Batch Array Engine, Merge Node, Data Cleaning Nodes, Binary File Pipeline, OAuth2 Auto-Refresh, Plugin System, Node Retry/Error Workflows, Canvas Data Pinning, Workflow Versioning |

---

## Revised Implementation Priority

Now that the scope is accurate, the **real work** is:

| Priority      | What to Build                                           | Impact                                        |
| :------------ | :------------------------------------------------------ | :-------------------------------------------- |
| 🟢 **High**   | **Messaging Channels System** (WhatsApp, FB, Slack)     | Biggest user-facing feature gap               |
| 🟢 **High**   | **Node-Level Retry + Continue on Fail**                 | Prevents production workflow crashes          |
| 🟡 **Medium** | **Merge + Data Transform Nodes** (Filter, Sort, Dedupe) | Enables data-heavy workflows                  |
| 🟡 **Medium** | **Canvas Node Data Pinning**                            | Massive developer productivity improvement    |
| 🔵 **Low**    | **Standalone Public Form Pages**                        | Extend existing Form Input to serve as a URL  |
| 🔵 **Low**    | **Workflow Versioning**                                 | Nice-to-have for larger teams                 |
| ⚪ **Defer**  | **Modular Plugin System**                               | Architectural overhaul, lower immediate value |
