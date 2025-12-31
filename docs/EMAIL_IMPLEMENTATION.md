# Email App - Implementation Summary

## Overview

The Email app has been successfully integrated into the phone emulator, providing a familiar email interface similar to the existing Messages app. Emails support HTML content with automatic sanitization and click-to-browser link handling.

## Features Implemented

### 1. **Email App Component** (`components/apps/EmailApp.tsx`)

- **Two-view pattern**: Inbox list and email detail view
- **HTML sanitization**: DOMPurify with strict allowlist for security
- **Link handling**: Intercepts clicks on `<a>` tags and opens URLs in BrowserApp
- **Avatar system**: Consistent color-coded avatars based on sender email hash
- **Unread indicators**: Blue dot and background highlight for unread emails
- **Delete functionality**: Delete individual emails with confirmation modal

### 2. **Email State Management** (`contexts/PhoneContext.tsx`)

- `emailMessages: Email[]` - Array of all email messages
- `addEmail()` - Add new email with auto-generated ID and timestamp
- `markEmailAsRead()` - Mark email as read
- `deleteEmail()` - Remove email by ID
- **localStorage persistence** - Emails survive page refreshes
- **Duplicate detection** - Prevents duplicate emails within 1 second window

### 3. **Email API Endpoints**

- **POST `/api/email`** - Receive emails (supports both local and remote delivery)
- **GET `/api/email/stream`** - Server-Sent Events endpoint for real-time delivery

### 4. **Real-Time Delivery** (`hooks/useEmailReceiver.ts`)

- Uses Server-Sent Events (SSE) for instant email delivery
- Automatically connects when phone number is provided
- Keep-alive heartbeat every 5 seconds
- Automatic reconnection on connection loss

### 5. **Email Tester Page** (`app/email-tester/page.tsx`)

- Form-based interface for sending test emails
- Pre-built templates: Promotional, Newsletter, Transactional
- HTML editor with syntax highlighting
- Real-time status feedback
- Phone number targeting for remote delivery

## Data Model

```typescript
interface Email {
  id: string // Auto-generated unique ID
  from: string // Sender email address
  to: string // Recipient (phone number or email)
  subject: string // Email subject line
  htmlContent?: string // HTML body (optional)
  textContent: string // Plain text fallback
  timestamp: Date // When email was received
  read: boolean // Read/unread status
}
```

## Security Features

### HTML Sanitization

All HTML content is sanitized using DOMPurify with strict allowlist:

**Allowed Tags**:

- Text: `p`, `div`, `span`, `br`, `strong`, `em`, `u`, `s`
- Links: `a` (href validated)
- Images: `img` (src validated)
- Lists: `ul`, `ol`, `li`
- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- Tables: `table`, `thead`, `tbody`, `tr`, `th`, `td`
- Code: `blockquote`, `pre`, `code`

**Allowed Attributes**: `href`, `src`, `alt`, `title`, `style`, `class`

**URL Validation**: Only `https:`, `http:`, and `mailto:` protocols allowed

### Blocked Content

- `<script>` tags
- Event handlers (`onclick`, `onload`, etc.)
- `javascript:` protocol URLs
- Data attributes
- Dangerous tags (`<iframe>`, `<object>`, `<embed>`)

## Usage

### Sending Email via API

```bash
curl -X POST https://phone-emulator.demo.now.hclsoftware.cloud/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+12345678901",
    "from": "marketing@example.com",
    "subject": "Welcome!",
    "htmlContent": "<h1>Hello!</h1><p>Welcome to our service!</p>",
    "textContent": "Hello! Welcome to our service!"
  }'
```

### Using Email Tester

1. Navigate to `https://phone-emulator.demo.now.hclsoftware.cloud/email-tester`
2. Enter phone number (must match phone logged into emulator)
3. Fill in from, subject, and HTML content
4. Click "Send Email"
5. Email appears instantly on phone via SSE

### Opening Email App

Click the blue Mail icon on phone home screen to view inbox.

## Architecture Decisions

### 1. **No Threading**

Emails are displayed in flat chronological list (newest first). Threading by subject/References header was deferred as not important for marketing email use case.

### 2. **No Attachments**

File attachments deferred. Inline images via `data:` URLs or `https:` links are supported in HTML.

### 3. **Individual Email Deletion**

Unlike Messages (which deletes entire conversations), emails can be deleted individually since there's no conversation grouping.

### 4. **Separate SSE Connection**

Email uses separate SSE endpoint (`/api/email/stream`) from SMS, allowing independent connections and easier debugging.

### 5. **HTML-First with Text Fallback**

If `htmlContent` provided, it's rendered (sanitized). Otherwise, `textContent` is displayed as plain text with `whitespace-pre-wrap`.

## Files Modified/Created

### Created

- `components/apps/EmailApp.tsx` - Email app component
- `app/api/email/route.ts` - Email POST endpoint
- `app/api/email/stream/route.ts` - Email SSE endpoint
- `hooks/useEmailReceiver.ts` - Email SSE client hook
- `app/email-tester/page.tsx` - Email testing interface
- `docs/EMAIL_IMPLEMENTATION.md` - This file

### Modified

- `types/app.ts` - Added `Email` interface
- `contexts/PhoneContext.tsx` - Added email state management
- `lib/appRegistry.tsx` - Registered Email app
- `app/page.tsx` - Connected email SSE receiver

## Testing

### Manual Test Flow

1. **Start Dev Server**: `npm run dev`
2. **Login to Phone**: Enter phone number (e.g., `+12345678901`)
3. **Open Email Tester**: Navigate to `/email-tester`
4. **Send Test Email**: Use promotional template, update phone number, send
5. **Verify Notification**: Blue notification banner appears on phone
6. **Open Email App**: Click Mail icon on home screen
7. **View Email**: Email appears in inbox with unread indicator
8. **Open Email**: Click email to view full content
9. **Click Link**: Click link in email, verify BrowserApp opens
10. **Delete Email**: Click trash icon, confirm deletion

### API Test

```bash
# Test local delivery (no phone number)
curl -X POST https://phone-emulator.demo.now.hclsoftware.cloud/api/email \
  -H "Content-Type: application/json" \
  -d '{"from":"test@example.com","subject":"Test","textContent":"Hello"}'

# Test remote delivery (with phone number)
curl -X POST https://phone-emulator.demo.now.hclsoftware.cloud/api/email \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+12345678901","from":"test@example.com","subject":"Test","htmlContent":"<h1>Hello</h1>"}'
```

## Integration with Marketing Platforms

Marketing automation platforms (e.g., HubSpot, Mailchimp, Marketo) can send emails to the phone emulator by calling the `/api/email` endpoint with the target phone number.

### Example Webhook Configuration

**Webhook URL**: `https://your-domain.com/api/email`

**Method**: POST

**Headers**: `Content-Type: application/json`

**Body Template**:

```json
{
  "phoneNumber": "{{contact.phone}}",
  "from": "{{campaign.from_email}}",
  "subject": "{{email.subject}}",
  "htmlContent": "{{email.html_body}}",
  "textContent": "{{email.text_body}}"
}
```

## Troubleshooting

### Email Not Appearing

1. **Check phone number matches**: Emulator and tester must use same phone number
2. **Verify SSE connection**: Check browser console for `[Email SSE] Connected` message
3. **Check API response**: Look for `deliveryMethod: "sse"` in API response
4. **Browser console errors**: Look for sanitization or rendering errors

### Links Not Opening

1. **Verify URL protocol**: Only `https:`, `http:`, `mailto:` allowed
2. **Check sanitization**: DOMPurify may strip invalid URLs
3. **localStorage check**: BrowserApp relies on `browserUrl` key

### HTML Not Rendering

1. **Check sanitization**: Dangerous tags/attributes stripped by DOMPurify
2. **Console warnings**: DOMPurify logs removed content to console
3. **Test with simple HTML**: Start with `<p>Hello</p>` to isolate issue

## Future Enhancements

- [ ] Star/favorite emails
- [ ] Archive functionality
- [ ] Search/filter emails
- [ ] Attachment support (file downloads)
- [ ] Inline image preview
- [ ] Thread grouping by subject
- [ ] Reply/forward actions
- [ ] Swipe gestures (delete, archive)
- [ ] Multiple email accounts
- [ ] Unread count badge on app icon

## Dependencies

- **dompurify**: ^3.0.6 - HTML sanitization
- **@types/dompurify**: ^3.0.5 - TypeScript types

---

**Last Updated**: November 13, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
