# SMS API Documentation

The Phone Emulator provides an API endpoint to send SMS messages to the emulated phone, allowing you to trigger notifications and demonstrate SMS-based marketing workflows.

## Endpoint

```
POST /api/sms
```

## Request

### Headers

```
Content-Type: application/json
```

### Body Parameters

| Parameter | Type   | Required | Description                             |
| --------- | ------ | -------- | --------------------------------------- |
| `sender`  | string | Yes      | The sender name/number for the SMS      |
| `message` | string | Yes      | The SMS message content (supports URLs) |

### Example Request

```bash
curl -X POST http://localhost:3000/api/sms \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "Demo Company",
    "message": "Hi! Check out our special offer: https://example.com/offer"
  }'
```

```javascript
// Using fetch in JavaScript
const response = await fetch("/api/sms", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    sender: "Demo Company",
    message: "Hi! Check out our special offer: https://example.com/offer",
  }),
})

const data = await response.json()
console.log(data)
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "SMS sent successfully",
  "data": {
    "sender": "Demo Company",
    "message": "Hi! Check out our special offer: https://example.com/offer",
    "timestamp": "2025-11-03T10:00:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Fields

```json
{
  "error": "Missing required fields: sender and message"
}
```

#### 400 Bad Request - Invalid Types

```json
{
  "error": "sender and message must be strings"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## Behavior

When an SMS is sent:

1. A notification banner appears at the top of the phone screen
2. The notification shows the sender and a preview of the message
3. Clicking the notification opens the Messages app
4. URLs in the message are automatically detected and made clickable
5. Clicking a URL in the message opens the Browser app with that URL

## Use Cases

### Marketing Campaign Demo

```javascript
// Send a promotional SMS with a link
await fetch("/api/sms", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sender: "SuperStore",
    message: "🎉 Flash Sale! 50% off everything today only. Shop now: https://superstore.com/sale",
  }),
})
```

### Appointment Reminder

```javascript
// Send an appointment reminder
await fetch("/api/sms", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sender: "Dr. Smith Office",
    message: "Reminder: Your appointment is tomorrow at 2 PM. View details: https://appointments.com/12345",
  }),
})
```

### Two-Factor Authentication

```javascript
// Send a verification code
await fetch("/api/sms", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sender: "YourApp",
    message: "Your verification code is: 123456. Or verify here: https://yourapp.com/verify/abc123",
  }),
})
```

## Testing

The application includes a built-in SMS Tester UI in the bottom-right corner of the screen. Use this to:

- Quickly test SMS sending without writing code
- Preview how messages will appear
- Test URL detection and clicking behavior

## Notes

- URLs are automatically detected in messages using the pattern `https?://[^\s]+`
- Multiple URLs in a single message are all made clickable
- The phone maintains message history until the page is refreshed
- Messages appear in the Messages app in reverse chronological order (newest first)
