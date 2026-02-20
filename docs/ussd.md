# USSD Dialer

This document covers the USSD simulation feature in the phone emulator: how it works, the demo scenario, the config file format, all API endpoints, CDP event integration, and how to build and distribute your own menu trees.

## Table of Contents

1. [Overview](#overview)
2. [Real-World USSD Architecture](#real-world-ussd-architecture)
3. [Demo Scenario: Safaricom and Equity Bank Kenya](#demo-scenario-safaricom-and-equity-bank-kenya)
4. [Dialer UX](#dialer-ux)
5. [Config File Format](#config-file-format)
6. [USSDNode Reference](#ussdnode-reference)
7. [API Reference](#api-reference)
8. [CDP Event Integration](#cdp-event-integration)
9. [The goto Pattern](#the-goto-pattern)
10. [Config Workflow: Build, Save, and Distribute](#config-workflow-build-save-and-distribute)
11. [Environment Variables](#environment-variables)
12. [Known Limitations](#known-limitations)

---

## Overview

USSD (Unstructured Supplementary Service Data) is a GSM protocol that allows mobile phones to communicate with a network operator's computers in real time using short codes such as `*100#` or `*247#`. Unlike SMS, USSD is session-based: a dialogue of request-and-response messages is maintained for the duration of the interaction.

The phone emulator includes a complete USSD simulation engine:

- A **Phone / Dialer app** that accepts USSD codes and renders the session dialogue
- A **server-side session engine** that walks a configurable menu tree
- A **visual config editor** at `/ussd-config` for building and editing menu trees
- **HCL CDP event firing** when specific nodes in the tree are reached
- A **distributable config file** (`ussd-config.json`) that can be copied between deployments

---

## Real-World USSD Architecture

Understanding how USSD works in practice helps when building realistic demo menus.

### How Telcos Own the Channel

In a real mobile network, USSD short codes are registered with and owned by the mobile network operator (MNO) — in this demo, Safaricom. When a subscriber dials `*100#`, the request travels over the SS7 signalling channel directly to the operator's platform. The operator's platform then either:

1. **Handles the request itself** — for operator self-service (airtime balance, data bundles).
2. **Routes the session to a third-party application server** — for services like mobile banking.

This second category is how banking USSD menus work. Equity Bank Kenya does not directly receive the raw SS7 signal — instead, Safaricom acts as a gateway and forwards the session (as HTTP requests) to Equity Bank's application server. From the subscriber's perspective, it looks seamless: they dial `*247#` and the Equity Bank menu appears. But the operator header always reads "Safaricom" because Safaricom owns the transport layer.

### Implications for the Demo

This is why the emulator's dialer always shows the `networkName` from the config (e.g. "Safaricom") in the green header bar — even when the subscriber is navigating Equity Bank menus. The bank name appears only inside the menu text itself ("Welcome to Equity Bank"). This accurately reflects real-world USSD UX.

### Session Lifecycle

A USSD session follows this lifecycle:

1. Subscriber dials a short code (e.g. `*100#`)
2. Network opens a session and sends the first menu page
3. Subscriber enters a digit (menu selection) or free text (account number, PIN, amount)
4. Server processes the input and returns the next menu page
5. Steps 3-4 repeat until either the subscriber exits or the service sets `sessionEnd: true`
6. Session is torn down; the handset returns to idle state

USSD sessions are synchronous and stateful for their duration. They time out if the subscriber is idle (typically 3 minutes on real networks; 5 minutes in this emulator).

---

## Demo Scenario: Safaricom and Equity Bank Kenya

The default `ussd-config.json` ships three fully-functional demo services set in East Africa:

### `*100#` — Safaricom Self-Service

Operator self-service for a Kenyan Safaricom subscriber.

| Path | Description | CDP Event |
|------|-------------|-----------|
| `1 > 1` | Airtime balance: KES 47.50 | `USSD Airtime Balance Checked` |
| `1 > 2` | Data balance: 1.2 GB main + 200 MB bonus | `USSD Data Balance Checked` |
| `1 > 3` | M-PESA balance: KES 1,340.00 | `USSD MPESA Balance Checked` |
| `2` | Buy airtime (enter amount, confirm) | `USSD Airtime Purchased` |
| `3` | Transfer airtime (enter number, enter amount) | `USSD Airtime Transferred` |
| `0` | Exit (session ends) | — |

### `*544#` — Safaricom Data Bundles

Data bundle purchase service.

| Path | Bundle | Price |
|------|--------|-------|
| `1 > 1` | 100 MB Daily | KES 20 |
| `1 > 2` | 1 GB Daily | KES 50 |
| `1 > 3` | 3 GB Daily | KES 100 |
| `2 > 1` | 1.5 GB Weekly | KES 150 |
| `2 > 2` | 3 GB Weekly | KES 250 |
| `2 > 3` | 7 GB Weekly | KES 500 |
| `3 > 1` | 5 GB Monthly | KES 500 |
| `3 > 2` | 15 GB Monthly | KES 1,000 |
| `3 > 3` | 30 GB Monthly | KES 1,500 |
| `4` | Data balance | `USSD Data Balance Checked` |

All purchase confirmations fire a `USSD Bundle Purchased` CDP event with `bundle_type`, `bundle_size`, and `price_kes` properties.

### `*247#` — Equity Bank Kenya

Mobile banking service routed through Safaricom's USSD gateway.

| Path | Description | CDP Event |
|------|-------------|-----------|
| `1 > 1` | Account balance: KES 34,210.00 | `USSD Balance Checked` |
| `1 > 2` | Mini statement (last 4 transactions) | `USSD Mini Statement Viewed` |
| `1 > 3` | Account details (masked account number) | — |
| `2 > 1` | Send money to Equity account (account + amount + PIN) | `USSD Money Transferred` |
| `2 > 2` | Send money to M-PESA (number + amount + PIN) | `USSD Money Transferred` |
| `3 > 1` | Buy airtime for self (amount + PIN) | `USSD Airtime Purchased` |
| `3 > 2` | Buy airtime for another number (recipient + amount + PIN) | `USSD Airtime Purchased` |
| `4 > 1` | Check loan eligibility (up to KES 50,000 at 12% p.a.) | `USSD Loan Eligibility Checked` |
| `4 > 1 > 1` | Apply for loan (amount + PIN) | `USSD Loan Applied` |
| `4 > 2` | Apply for loan directly (amount + PIN) | `USSD Loan Applied` |
| `4 > 3` | Loan balance (KES 15,000 active) | `USSD Loan Balance Checked` |

---

## Dialer UX

### Opening the Dialer

The Phone app is the **first icon** on the home screen (green background, phone handset icon, app ID `dialer`). Open it to see the dialer interface.

### Layout

- **White background** for the content area
- **Green operator header** at the top, always showing `networkName` from the config
- **USSD display area** above the keypad showing session responses in a monospaced-friendly format
- **Grey T9 keypad** at the bottom with digits 0-9, `*`, and `#`
- **Single green send button** centered below the keypad (no red end button — sessions end via menu option `0` or when the service sets `sessionEnd: true`)

### Dialling a Code

Type a USSD code using the keypad (e.g. `*100#`). When you press `#`, the code is automatically sent to the server to start a session. The response appears in the display area above the keypad.

### Menu Navigation

**Numbered menu selections** fire immediately on keypress. There is no need to press the send button. This matches real USSD UX on feature phones where a single digit selection sends immediately.

**Free-text input nodes** (`isInput: true`) accumulate digits as you type. Press the green button to send the accumulated input. This handles account numbers, PINs, and amounts.

### Special Code: `*#06#`

Typing `*#06#` displays the device IMEI — handled entirely client-side with no server call. The IMEI is a Luhn-valid 15-digit number generated once and stored in `localStorage` as `device-imei`. It persists across sessions.

### Session End

Sessions end when:
- The current node has `sessionEnd: true` (e.g. typing `0` at the main menu)
- The server returns `sessionActive: false`
- Five minutes of inactivity on the server (session cleaned up automatically)

When a session ends, the dialer returns to idle state. The keypad is ready for a new code.

---

## Config File Format

The USSD configuration lives in `ussd-config.json` in the **project root** (alongside `package.json`). This file is:

- Read by the server on startup (module-level singleton)
- Written when you click Save in the config editor
- Deleted when you click Load Defaults (reverting to the built-in minimal config)
- Distributable: copy the file to share a complete demo scenario with another deployment

### Top-Level Structure

```json
{
  "networkName": "Safaricom",
  "codes": {
    "*100#": { ... },
    "*544#": { ... },
    "*247#": { ... }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `networkName` | string (optional) | Operator name shown in the dialer header. Defaults to `"Network"` if absent. |
| `codes` | `Record<string, USSDNode>` | Map of root USSD codes to their root node. Keys must match exactly what users dial (including `*` and `#`). |

---

## USSDNode Reference

Every node in the tree — root codes and all child responses — is a `USSDNode`.

```typescript
interface USSDNode {
  response: string
  options?: Record<string, USSDNode>
  isInput?: boolean
  cdpEvent?: USSDCDPEvent
  sessionEnd?: boolean
  goto?: string
}
```

### Field Reference

#### `response` (required)

The text displayed to the user when this node is reached. Use `\n` for line breaks. USSD displays typically render in a fixed-width font, so align text accordingly.

```json
{
  "response": "Safaricom Self Service\n1. My Balance\n2. Buy Airtime\n0. Exit"
}
```

#### `options` (optional)

A map from user input to the next node. Keys are strings:

- `"0"` through `"9"`: specific digit selections (menu options)
- `"*"`: wildcard — matches any input that has no exact key match. Used for free-text input nodes where any value is valid.

```json
{
  "response": "Choose service:\n1. Balance\n0. Exit",
  "options": {
    "1": { "response": "Balance: KES 47.50\n0. Main Menu", "options": { "0": { "goto": "*100#", "response": "" } } },
    "0": { "response": "Goodbye!", "sessionEnd": true }
  }
}
```

If the user enters a digit that is not in `options` and there is no `"*"` wildcard, the server responds with `"Invalid option."` and re-presents the current node's response.

#### `isInput` (optional, boolean)

When `true`, the dialer accumulates typed digits and waits for the green send button before submitting. Use this for free-text fields: account numbers, phone numbers, PINs, amounts.

```json
{
  "response": "Enter amount (KES):",
  "isInput": true,
  "options": {
    "*": {
      "response": "Confirm purchase?\n1. Confirm\n2. Cancel",
      "options": { ... }
    }
  }
}
```

The `"*"` wildcard in `options` captures whatever text the user submitted.

#### `cdpEvent` (optional)

Fires an HCL CDP track event when this node is reached. See [CDP Event Integration](#cdp-event-integration) for full details.

```json
{
  "cdpEvent": {
    "eventId": "USSD Balance Checked",
    "properties": {
      "channel": "ussd",
      "bank": "equity",
      "service": "balance_inquiry"
    }
  }
}
```

#### `sessionEnd` (optional, boolean)

When `true`, the session is terminated immediately after this node's `response` is returned. The session is removed from the server's in-memory store. The dialer returns to idle state.

```json
{
  "response": "Thank you for using Safaricom.\nGoodbye!",
  "sessionEnd": true
}
```

#### `goto` (optional, string)

Redirects the session to a different root code's node without ending the session. The value must be a key in `codes` (e.g. `"*100#"`). See [The goto Pattern](#the-goto-pattern) for full details.

```json
{
  "goto": "*100#",
  "response": ""
}
```

The `response` field on a `goto` node is unused (the root node's response is shown instead), but must be present to satisfy the TypeScript interface. Set it to `""`.

---

## API Reference

### POST /api/ussd/session

Start a new USSD session or continue an existing one.

**Start a new session** — provide `phoneNumber` and `ussdCode`:

```bash
curl -X POST http://localhost:3000/api/ussd/session \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "ussdCode": "*100#"
  }'
```

**Continue a session** — provide `sessionId` and `input`:

```bash
curl -X POST http://localhost:3000/api/ussd/session \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "ussd_1740000000000_abc1234",
    "input": "1"
  }'
```

**Response** (both cases):

```json
{
  "sessionId": "ussd_1740000000000_abc1234",
  "response": "Safaricom Self Service\n1. My Balance\n2. Buy Airtime\n3. Transfer Airtime\n0. Exit",
  "sessionActive": true,
  "requiresInput": false,
  "networkName": "Safaricom"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string or null | Session identifier for subsequent requests. `null` when `sessionActive` is `false`. |
| `response` | string | Menu text to display. |
| `sessionActive` | boolean | `false` when the session has ended (via `sessionEnd: true` or unrecognised code). |
| `requiresInput` | boolean | `true` when the current node is `isInput: true`. Dialer should wait for green button. |
| `networkName` | string | Operator name from config for the dialer header. |

**Error responses:**

| Status | Scenario |
|--------|----------|
| 400 | Missing required fields |
| 404 | Session not found or expired |
| 500 | Internal server error |

If `ussdCode` is not found in the config, the response has status `200` with `sessionActive: false` and a "not recognised" message — not an error status.

---

### DELETE /api/ussd/session

End an active session explicitly (e.g. user pressed a hardware back button or navigated away).

```bash
curl -X DELETE http://localhost:3000/api/ussd/session \
  -H "Content-Type: application/json" \
  -d '{ "sessionId": "ussd_1740000000000_abc1234" }'
```

**Response:**

```json
{
  "success": true,
  "deleted": true
}
```

`deleted` is `false` if the session did not exist (already expired or never created).

---

### GET /api/ussd/config

Retrieve the current USSD configuration as a `USSDConfig` object.

```bash
curl http://localhost:3000/api/ussd/config
```

**Response:**

```json
{
  "success": true,
  "data": {
    "networkName": "Safaricom",
    "codes": {
      "*100#": { "response": "...", "options": { ... } },
      "*544#": { "response": "...", "options": { ... } },
      "*247#": { "response": "...", "options": { ... } }
    }
  }
}
```

---

### POST /api/ussd/config

Replace the entire USSD configuration. Takes effect immediately for new sessions. Writes the new config to `ussd-config.json` on disk.

```bash
curl -X POST http://localhost:3000/api/ussd/config \
  -H "Content-Type: application/json" \
  -d '{
    "networkName": "My Network",
    "codes": {
      "*999#": {
        "response": "My Service\n1. Option A\n0. Exit",
        "options": {
          "1": { "response": "You chose A.\n0. Main Menu", "options": { "0": { "goto": "*999#", "response": "" } } },
          "0": { "response": "Goodbye!", "sessionEnd": true }
        }
      }
    }
  }'
```

**Response:** Returns the saved config with `{ "success": true, "data": { ... } }`.

**Validation:** Requires a `codes` field that is a non-null object. Returns `400` otherwise.

---

### DELETE /api/ussd/config

Reset to built-in defaults. Deletes `ussd-config.json` from disk. The in-memory config is immediately replaced with the minimal default. New server starts will also use the defaults until a new Save is performed.

```bash
curl -X DELETE http://localhost:3000/api/ussd/config
```

**Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Config reset to defaults"
}
```

---

## CDP Event Integration

USSD nodes can fire HCL CDP track events when they are reached. This enables real-time customer journey data to flow into HCL CDP as subscribers interact with USSD menus — useful for demonstrating event-driven marketing automation.

### How It Works

1. A `USSDNode` carries an optional `cdpEvent` field:

   ```json
   {
     "response": "M-PESA Balance\nKES 1,340.00\n\n0. Main Menu",
     "cdpEvent": {
       "eventId": "USSD MPESA Balance Checked",
       "properties": {
         "channel": "ussd",
         "operator": "safaricom",
         "service": "mpesa_balance"
       }
     }
   }
   ```

2. When the session route resolves to a node with `cdpEvent`, it calls `fireCDPEvent()` asynchronously using the `@hcl-cdp-ta/cdp-node-sdk`.

3. The event is sent as a `Track` event type. The user identity is set to `{ type: Primary, field: "phone", value: phoneNumber }` — the phone number the user entered at login.

4. If `CDP_API_KEY` or `CDP_PASS_KEY` are not set, the event is skipped with a console log. CDP events are always non-fatal: a failure will produce a console warning but the USSD session continues normally.

### SDK Usage Pattern

```typescript
const config = new ApiConfiguration(apiKey, passKey)
const client = new ApiClient(config)
const identity = new UserIdentity(UserIdentityType.Primary, "phone", phoneNumber)
const request = new ApiRequest(EventType.Track, event.eventId, identity, event.properties ?? {})
const response = await client.sendEvent(request)
```

### Configuring CDP

Add to your `.env` or `.env.local`:

```bash
CDP_API_KEY=your-hcl-cdp-api-key
CDP_PASS_KEY=your-hcl-cdp-pass-key
```

The `next.config.ts` declares `@hcl-cdp-ta/cdp-node-sdk` in `serverExternalPackages` so Next.js does not attempt to bundle this Node.js-only package through webpack.

### Event Properties

The `properties` field on `cdpEvent` accepts any `Record<string, string | number | boolean>`. Properties are passed through to CDP as-is. Common patterns used in the default config:

```json
{ "channel": "ussd", "operator": "safaricom", "service": "airtime_balance" }
{ "channel": "ussd", "bank": "equity", "service": "balance_inquiry" }
{ "channel": "ussd", "bundle_type": "daily", "bundle_size": "100MB", "price_kes": 20 }
```

---

## The goto Pattern

### The Problem

USSD menus are deeply nested trees. Every service typically has a "0. Main Menu" option on every response screen. Without a `goto` mechanism, you would need to duplicate the entire root node and all its children at every leaf.

For example, if `*100#` has 3 levels of depth and each leaf has a "0. Main Menu" option, you would need to copy the full root subtree dozens of times. This makes the config enormous and means any change to the main menu must be replicated everywhere.

### The Solution

The `goto` field on a `USSDNode` tells the session engine to resolve the node as if the user had dialled the named root code from scratch — but without ending the session. The session continues with the root node of the target code as the new current node.

```json
{
  "response": "M-PESA Balance\nKES 1,340.00\n\n0. Main Menu",
  "options": {
    "0": { "goto": "*100#", "response": "" }
  }
}
```

When the user presses `0`, the session engine:

1. Finds the option node: `{ "goto": "*100#", "response": "" }`
2. Detects `goto` is set
3. Looks up `config.codes["*100#"]`
4. Sets the resolved root node as the new `session.currentNode`
5. Returns the root node's `response` to the user

The user sees the `*100#` main menu again. The session remains active. The history array records `"0"` as the input.

### goto Rules

- The value must be a key in the top-level `codes` map. If the key does not exist, the original `goto` node is used as-is (which has an empty `response` — presenting a blank screen).
- `goto` nodes do not fire `cdpEvent` on the `goto` node itself. If you want a CDP event when the user returns to main menu, put the `cdpEvent` on the root node.
- The `response` field on a `goto` node is not shown (the target root node's response is shown instead). Set it to `""` as a convention.
- `goto` does not reset the session history. If you inspect session history, you will see the full path of inputs including the `"0"` that triggered the goto.

### Cross-Code goto

`goto` works across different root codes. A node in the `*247#` Equity Bank tree could use `goto: "*100#"` to navigate to the Safaricom main menu. This would be unusual in a real scenario (banks do not hand off USSD sessions to operator self-service) but is technically valid in the emulator.

---

## Config Workflow: Build, Save, and Distribute

### Building a Config in the Editor

1. Open the settings dropdown (top-right gear icon on the main page)
2. Click "USSD Config"
3. The config editor opens at `/ussd-config` with a teal/green theme
4. The **left panel** shows the recursive node tree. Each node is labelled with its key:
   - Root codes show as `*100#`, `*544#`, etc.
   - Child options show as `[1]`, `[2]`, `[0]`, etc.
   - Badges indicate `END` (sessionEnd), `INPUT` (isInput), and `CDP` (cdpEvent)
   - Click any node to select it; click the triangle to expand/collapse
5. The **right panel** shows the node editor for the selected node:
   - **Response**: the text shown to the user
   - **Network Name**: only on root nodes — sets `networkName` for the whole config
   - **Is Input node**: checkbox for `isInput`
   - **Session ends here**: checkbox for `sessionEnd`
   - **CDP Event ID**: field for `cdpEvent.eventId`
   - **CDP Properties**: key-value pairs for `cdpEvent.properties`
   - **goto target**: field for the `goto` value
   - **Child options**: add/remove options with their digit keys
6. Click **Save** to write to the server and to `ussd-config.json`

### Exporting a Config

Click **Export JSON** to download the current config as a file (e.g. `ussd-config.json`). The downloaded file is the exact JSON that would be written to disk.

### Importing a Config

Click **Import JSON** to upload a previously exported file. The file is parsed in the browser, pushed to `POST /api/ussd/config`, and the editor reloads from the server response. The file is also written to `ussd-config.json`.

### Reverting to Defaults

Click **Load Defaults** to call `DELETE /api/ussd/config`. The server deletes `ussd-config.json` and reverts to the minimal built-in config in `lib/ussdDefaults.ts`. The editor reloads.

### Distributing a Config

`ussd-config.json` is the complete, self-contained demo configuration. To share a demo scenario:

1. Build the menu tree in the editor and click Save
2. Export JSON (or copy `ussd-config.json` from the project root)
3. On the target instance, either:
   - Drop the file in the project root and restart the server, or
   - Use Import JSON in the config editor to push it via the API without restarting

The file format is stable — it is the exact `USSDConfig` interface serialized to JSON.

### localStorage Caching

The config editor caches the last-saved config in `localStorage` under the key `ussd-config`. On page load, the editor reads from localStorage for an instant render, then fetches the server's current config and reconciles. This means the editor feels instant even on slow connections, and the server config is always authoritative.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CDP_API_KEY` | No | HCL CDP API key. If absent, CDP events are skipped (non-fatal). |
| `CDP_PASS_KEY` | No | HCL CDP pass key. Must be set alongside `CDP_API_KEY`. |

Add to `.env.local` for development or `.env` for production:

```bash
# HCL CDP integration for USSD events
CDP_API_KEY=your-cdp-api-key
CDP_PASS_KEY=your-cdp-pass-key
```

No other environment variables are required for USSD. The feature works without a database and without the phone number login (the dialer uses whatever phone number was entered at login as the CDP identity; if no phone number was set, events are still fired with an empty string identity).

---

## Known Limitations

- **In-memory sessions**: USSD sessions are held in a server-side `Map`. They are lost on server restart. This is consistent with the SSE connection model used for SMS and email delivery. Sessions auto-expire after 5 minutes.
- **Single shared config**: `ussd-config.json` is a single file shared by all server processes. There is no per-user or per-session config isolation. In a multi-instance deployment, each instance reads its own copy of the file.
- **No session replay**: The session `history` array records all inputs but is not exposed via the API. You cannot replay a session path from the outside.
- **No real telco integration**: The emulator does not connect to any SS7 or USSD gateway. All sessions are handled entirely within the Next.js server.
- **goto does not reset history**: The session history accumulates all inputs including those that triggered goto navigations. This is intentional but may result in long history arrays in deeply navigated sessions.
