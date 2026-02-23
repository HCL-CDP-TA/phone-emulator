# API Endpoints

## POST /api/sms

Send SMS to phone emulator. Supports both local and remote delivery.

**Local delivery (same browser - no phone number)**:

```json
{
  "sender": "Demo Company",
  "message": "Your message here"
}
```

**Remote delivery (different browser - with phone number)**:

```json
{
  "phoneNumber": "+12345678901",
  "sender": "Demo Company",
  "message": "Your message here"
}
```

Delivery methods:

- No `phoneNumber`: Uses BroadcastChannel for same-browser tabs
- With `phoneNumber` + active SSE connection: Instant delivery via Server-Sent Events
- With `phoneNumber` + offline: Queued for polling fallback

## GET /api/sms/stream

Server-Sent Events endpoint for real-time message delivery. Phone establishes persistent connection on load with phone number. Messages sent via POST /api/sms are instantly broadcast to connected clients.

Query params: `phoneNumber` (required, URL-encoded)

## POST /api/email

Send email to phone emulator. Supports both local and remote delivery.

**Request**:

```json
{
  "phoneNumber": "+12345678901",
  "from": "marketing@company.com",
  "fromName": "Marketing Team",
  "to": "customer@example.com",
  "subject": "Special Offer",
  "htmlContent": "<h1>Hello!</h1><p>Check our <a href='https://example.com'>offer</a></p>",
  "textContent": "Hello! Check our offer: https://example.com"
}
```

Delivery methods:

- With `phoneNumber` + active SSE connection: Instant delivery via Server-Sent Events
- With `phoneNumber` + offline: 404 with warning (no queue for emails)

## GET /api/email/stream

Server-Sent Events endpoint for real-time email delivery. Works identically to SMS stream but for emails.

Query params: `phoneNumber` (required, URL-encoded)

## POST /api/push

Send a push notification to a specific app on the phone emulator. Unlike SMS/email, push notifications target an app by ID and support rich content.

**Required fields**: `phoneNumber`, `appId`, `title`, `body`

**Request**:

```json
{
  "phoneNumber": "+12345678901",
  "appId": "unibank",
  "title": "Summer Sale!",
  "body": "Get 50% off all items this weekend only.",
  "imageUrl": "https://example.com/banner.jpg",
  "actionButtons": [
    { "id": "shop", "label": "Shop Now", "url": "https://example.com/sale" },
    { "id": "dismiss", "label": "Dismiss", "url": "" }
  ]
}
```

- `imageUrl` (optional): Displayed as an h-32 banner image in the notification
- `actionButtons` (optional): Max 3 buttons; `url` opens in the phone's browser app; empty `url` just dismisses the notification

**Delivery**: Instant via SSE if phone is connected; returns 404 if no active connection (no queue).

```bash
curl -X POST http://localhost:3000/api/push \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+12345678901",
    "appId": "unibank",
    "title": "Special Offer",
    "body": "Tap to view your personalised deal."
  }'
```

## GET /api/push/stream

Server-Sent Events endpoint for real-time push notification delivery. Phone establishes a persistent connection on load (2.5s after other SSE connections). Keep-alive ping every 30 seconds.

Query params: `phoneNumber` (required, URL-encoded)

## GET /api/location-presets

Fetch all location presets from the database.

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "San Francisco Downtown",
      "description": "Downtown SF location",
      "type": "static",
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    {
      "id": "uuid",
      "name": "Route to Golden Gate",
      "description": "Walking route",
      "type": "route",
      "waypoints": [
        {"latitude": 37.7749, "longitude": -122.4194, "speed": 5},
        {"latitude": 37.8024, "longitude": -122.4058, "speed": 5}
      ]
    }
  ]
}
```

## POST /api/location-presets

Create a new location preset.

**Request (Static Location)**:

```json
{
  "name": "Times Square",
  "description": "NYC landmark",
  "type": "static",
  "latitude": 40.7580,
  "longitude": -73.9855
}
```

**Request (Route)**:

```json
{
  "name": "Central Park Loop",
  "description": "Running route",
  "type": "route",
  "waypoints": [
    {"latitude": 40.7829, "longitude": -73.9654, "speed": 10},
    {"latitude": 40.7849, "longitude": -73.9684, "speed": 10},
    {"latitude": 40.7869, "longitude": -73.9714, "speed": 10}
  ]
}
```

**Response**: Returns created preset with `201` status.

## GET /api/location-presets/[id]

Fetch a single location preset by ID.

**Response**: Same format as individual preset in list above.

## PUT /api/location-presets/[id]

Update an existing location preset.

**Request**: Same format as POST (all fields required).

**Response**: Returns updated preset.

## DELETE /api/location-presets/[id]

Delete a location preset.

**Response**:

```json
{
  "success": true,
  "message": "Preset deleted"
}
```

## POST /api/ussd/session

Start a new USSD session or continue an existing one.

**Start session** (provide `ussdCode`):

```json
{
  "phoneNumber": "+254712345678",
  "ussdCode": "*100#"
}
```

**Continue session** (provide `sessionId` and `input`):

```json
{
  "sessionId": "ussd_1234567890_abc1234",
  "input": "1"
}
```

**Response**:

```json
{
  "sessionId": "ussd_1234567890_abc1234",
  "response": "Safaricom Self Service\n1. My Balance\n2. Buy Airtime\n3. Transfer Airtime\n0. Exit",
  "sessionActive": true,
  "requiresInput": false,
  "networkName": "Safaricom"
}
```

- `sessionId` is `null` when the session has ended (`sessionActive: false`)
- `requiresInput: true` means the node expects free-text entry (accumulate digits, send on green button)
- If `ussdCode` is not found in the config, `sessionActive` is `false` and a "not recognised" message is returned

## DELETE /api/ussd/session

End an active USSD session.

**Request**:

```json
{
  "sessionId": "ussd_1234567890_abc1234"
}
```

**Response**:

```json
{
  "success": true,
  "deleted": true
}
```

## GET /api/ussd/config

Get the current USSD configuration (full `USSDConfig` object).

**Response**:

```json
{
  "success": true,
  "data": {
    "networkName": "Safaricom",
    "codes": {
      "*100#": { "response": "...", "options": {} }
    }
  }
}
```

## POST /api/ussd/config

Replace the entire USSD configuration. Writes to `ussd-config.json` on disk.

**Request**: A `USSDConfig` object (see Key Interfaces in architecture.md).

**Response**:

```json
{
  "success": true,
  "data": { ... }
}
```

## DELETE /api/ussd/config

Reset to built-in defaults. Deletes `ussd-config.json` from disk so defaults load on next server start.

**Response**:

```json
{
  "success": true,
  "data": { ... },
  "message": "Config reset to defaults"
}
```
