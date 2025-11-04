# Remote SMS API Feature

## Overview

The phone emulator now supports receiving SMS messages from external systems (different browsers, computers, or marketing automation platforms) by "logging in" with a phone number.

## How It Works

### 1. Phone Number Login

When you open the phone emulator, you'll see a login screen:

1. Enter a phone number in international format (e.g., `+12345678901`)
2. Click "Connect Phone"
3. The phone number is saved in localStorage and displayed in the top-right corner
4. Click the logout button to disconnect and use a different number

### 2. Receiving Remote Messages

Once logged in, the phone:

- **Polls every 2 seconds** for new messages via `GET /api/sms/poll?phoneNumber=+12345678901`
- Automatically delivers messages from the server-side queue
- Works even if the sender is on a different computer/browser

### 3. Sending Remote Messages

External systems (like marketing automation platforms) can send SMS by calling:

```bash
POST /api/sms
Content-Type: application/json

{
  "phoneNumber": "+12345678901",
  "sender": "Acme Corp",
  "message": "Your verification code is 123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "SMS queued for delivery",
  "phoneNumber": "+12345678901",
  "data": {
    "sender": "Acme Corp",
    "message": "Your verification code is 123456",
    "timestamp": "2024-11-04T12:00:00.000Z"
  }
}
```

## API Endpoints

### POST /api/sms

Send SMS to a phone (supports both local and remote delivery)

**Request:**

```json
{
  "phoneNumber": "+12345678901", // Optional: for remote delivery
  "sender": "Company Name", // Required
  "message": "Message text" // Required
}
```

- **With phoneNumber**: Message is queued on server for remote delivery
- **Without phoneNumber**: Message is sent via BroadcastChannel (same-browser only)

### GET /api/sms/poll

Poll for new messages (used internally by phone emulator)

**Query Parameters:**

- `phoneNumber` (required): The phone number to check
- `since` (optional): Unix timestamp - only return messages after this time

**Response:**

```json
{
  "success": true,
  "phoneNumber": "+12345678901",
  "messages": [
    {
      "sender": "Acme Corp",
      "message": "Hello!",
      "timestamp": 1699104000000
    }
  ],
  "count": 1
}
```

## Message Queue

- **In-memory storage**: Messages are stored in a Map on the server
- **Auto-cleanup**: Messages older than 5 minutes are automatically deleted
- **Limit**: Maximum 50 messages per phone number
- **Production**: Replace with Redis or database for persistence

## Use Cases

### Marketing Automation Integration

```javascript
// From your marketing automation system
await fetch("https://your-emulator.com/api/sms", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    phoneNumber: customerPhoneNumber, // e.g., "+12345678901"
    sender: "YourBrand",
    message: `Hi ${customerName}, check out our latest offer!`,
  }),
})
```

### Demo Scenarios

1. **Remote Demo**:

   - Phone on projector/shared screen
   - Send messages from your laptop
   - No need to be on same browser

2. **Customer Personas**:

   - Login as different phone numbers
   - Represent different fake customers
   - Receive targeted campaigns for each

3. **Testing Campaigns**:
   - Trigger real campaign workflows
   - Messages appear on emulator in real-time
   - No physical device needed

## Backward Compatibility

**Existing functionality is preserved:**

- ✅ On-page tester still works (same window)
- ✅ Separate tab tester still works (BroadcastChannel)
- ✅ LocalStorage persistence still works
- ✅ All existing apps still work

**New additions:**

- 🆕 Phone number login screen
- 🆕 Server-side message queue
- 🆕 Polling for remote messages
- 🆕 Cross-browser/cross-computer support
- 🆕 API support for phoneNumber parameter

## Implementation Details

### Client-Side Polling

Located in `/app/page.tsx`:

```typescript
useEffect(() => {
  if (!phoneNumber) return

  const pollForMessages = async () => {
    const response = await fetch(`/api/sms/poll?phoneNumber=${phoneNumber}&since=${lastPollTime}`)
    const data = await response.json()
    data.messages.forEach(msg => addSMS(msg))
  }

  const interval = setInterval(pollForMessages, 2000)
  return () => clearInterval(interval)
}, [phoneNumber])
```

### Server-Side Queue

Located in `/app/api/sms/poll/route.ts`:

```typescript
// In-memory Map: { phoneNumber: [{ sender, message, timestamp }, ...] }
const messageQueues = new Map()

// Messages auto-expire after 5 minutes
// Maximum 50 messages per phone number
```

### Phone Number Validation

Format: `+[country code][number]`

- Must start with `+`
- Must contain 10-15 digits after the `+`
- Examples: `+12345678901`, `+447700900123`, `+61412345678`

## Security Considerations

**Current Implementation:**

- No authentication required
- Anyone can send to any phone number
- Messages stored in memory (no persistence)

**For Production:**

- Add API key authentication
- Rate limiting per phone number
- Use Redis/database for persistence
- Add message encryption
- Validate sender identity
- Add CORS restrictions

## Testing

### Test Remote Delivery

1. **Open phone in Browser A**: Enter phone number `+12345678901`
2. **From Browser B** (or curl):
   ```bash
   curl -X POST http://localhost:3000/api/sms \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber":"+12345678901","sender":"Test","message":"Hello!"}'
   ```
3. **Within 2 seconds**, message appears on phone in Browser A

### Test Same-Browser

1. Open phone emulator
2. Use on-page tester (bottom-right button)
3. Message appears instantly (no polling)

## Future Enhancements

- [ ] WebSocket for real-time push (eliminate polling)
- [ ] Message read receipts
- [ ] Message delivery status
- [ ] Multi-phone support (one browser, multiple phone numbers)
- [ ] Message history API endpoint
- [ ] Phone number aliases (e.g., "Customer A" → "+12345")
- [ ] SMS rate limiting per sender
- [ ] Message templates
- [ ] Scheduled messages
