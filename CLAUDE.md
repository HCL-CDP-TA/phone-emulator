# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js-based phone emulator for demonstrating martech (marketing technology) software. The emulator displays a realistic smartphone interface in a desktop browser, capable of receiving SMS and HTML emails via API, displaying notifications, and running modular apps including a functional web browser.

**Key Design Principle**: The emulator uses a modular architecture where new apps can be added without modifying core infrastructure - just create a component and register it.

## Development Commands

```bash
# Development server (Next.js with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

The development server runs on `http://localhost:3000` by default.

## Architecture Overview

### Core Design Patterns

**1. Registry Pattern (`/lib/appRegistry.tsx`)**

All apps are registered centrally. Adding a new app requires:

- Creating a component in `/components/apps/YourApp.tsx`
- Implementing the `AppProps` interface
- Adding an entry to the `appRegistry` array

The home screen automatically displays all registered apps.

**2. Context-Based State Management (`/contexts/PhoneContext.tsx`)**

Global phone state managed through React Context:

- Active app tracking
- SMS messages with localStorage persistence
- Email messages with localStorage persistence
- Notifications
- Location services (geolocation)
- App navigation (open/close)

Key functions: `openApp()`, `closeApp()`, `addSMS()`, `markSMSAsRead()`, `deleteConversation()`, `addEmail()`, `markEmailAsRead()`, `deleteEmail()`, `addNotification()`, `requestLocation()`, `watchLocation()`

**3. Dual Delivery System for SMS**

Two communication mechanisms:

- **Local (same browser)**: BroadcastChannel API for cross-tab messaging
- **Remote (different browsers/computers)**: Server-Sent Events (SSE) for real-time delivery via phone number targeting

SSE endpoint (`/app/api/sms/stream/route.ts`) maintains persistent connections and broadcasts messages instantly when received via API.

**4. Phone Shell Component Pattern**

The `Phone.tsx` component orchestrates the UI shell:

- StatusBar (always visible, z-40)
- App content area (automatic padding for StatusBar)
- Home button (visible only when app is open)
- NotificationBanner
- HomeScreen (when no app active)

**Apps don't manage chrome/shell concerns** - they receive full height and the Phone component handles all padding and navigation UI.

### Key Interfaces

```typescript
// All apps must implement this
interface AppProps {
  onClose: () => void
  onSendNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
  location?: GeolocationPosition | null
  locationError?: GeolocationPositionError | null
  requestLocation?: () => void
}

// SMS message structure
interface SMS {
  id: string
  sender: string
  message: string
  timestamp: Date
  read: boolean
}

// Email message structure
interface Email {
  id: string
  from: string // email address
  fromName?: string // display name (optional)
  to: string // recipient email
  subject: string
  htmlContent?: string // HTML email body (sanitized with DOMPurify)
  textContent: string // plain text fallback
  timestamp: Date
  read: boolean
}

// App registry entry
interface App {
  id: string
  name: string
  icon: ReactNode
  iconColor: string
  component: ComponentType<AppProps>
  category: string
}
```

## File Structure

```
/app
  /page.tsx                     - Main entry: phone number login + SSE connection + tester dropdown
  /tester/page.tsx              - SMS tester (opens in new window)
  /email-tester/page.tsx        - Email tester (opens in new window)
  /api/sms/route.ts             - Main SMS API (SSE + queue fallback)
  /api/sms/stream/route.ts      - SSE endpoint for real-time delivery
  /api/sms/poll/route.ts        - DEPRECATED polling fallback
  /api/email/route.ts           - Email API endpoint
  /api/email/stream/route.ts    - Email SSE endpoint for real-time delivery

/components
  /phone
    /Phone.tsx                  - Phone shell (padding, home button, chrome)
    /PhoneNumberLogin.tsx       - Phone number entry screen
    /StatusBar.tsx              - Status bar (time, battery, signal)
    /HomeScreen.tsx             - App grid
    /NotificationBanner.tsx     - Sliding notification display
  /apps
    /MessagesApp.tsx            - Conversation-based messaging with avatars
    /EmailApp.tsx               - HTML email with DOMPurify sanitization, notifications
    /BrowserApp.tsx             - iframe-based web browser with address bar
    /MapsApp.tsx                - Location-enabled maps using OpenStreetMap
    /[DummyApps].tsx            - Camera, Photos, Clock, Calculator, etc.

/contexts
  /PhoneContext.tsx             - Global state management

/hooks
  /useSMSReceiver.ts            - BroadcastChannel setup, SMS delivery
  /useEmailReceiver.ts          - Email SSE connection hook
  /useLocation.ts               - Location access hook

/lib
  /appRegistry.tsx              - Central app registry (CRITICAL for extensions)

/types
  /app.ts                       - TypeScript interfaces
```

## Common Development Tasks

### Adding a New App

1. **Create the component** (`/components/apps/YourApp.tsx`):

```tsx
"use client"
import { AppProps } from "@/types/app"

export default function YourApp({ onClose }: AppProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={onClose} className="text-blue-500">
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Your App</h1>
        <div className="w-16" />
      </div>
      <div className="flex-1 overflow-y-auto p-4">{/* App content */}</div>
    </div>
  )
}
```

2. **Register in appRegistry** (`/lib/appRegistry.tsx`):

```tsx
import YourApp from "@/components/apps/YourApp"

export const appRegistry: App[] = [
  // ... existing apps
  {
    id: "yourapp",
    name: "Your App",
    icon: <svg>...</svg>,
    iconColor: "bg-purple-500",
    component: YourApp,
    category: "utility",
  },
]
```

**Important**: Apps receive full height. Don't add top padding - the Phone component adds `pt-11` automatically to account for the StatusBar.

### Using Location Services

Location is automatically requested when the phone loads. Apps can access it via:

```tsx
import { useLocation } from "@/hooks/useLocation"

// In your app component:
const { position, error, isLoading, requestLocation } = useLocation()

if (position) {
  const { latitude, longitude } = position.coords
  // Use location data
}
```

Or via props: `location`, `locationError`, `requestLocation` are passed to all apps.

### Accessing Phone Context

```tsx
import { usePhone } from "@/contexts/PhoneContext"

const { smsMessages, openApp, addNotification, location } = usePhone()
```

### Sending Notifications from Apps

```tsx
onSendNotification({
  appId: "messages",
  appName: "Messages",
  title: "New Message",
  message: "Hello!",
  onClick: () => openApp("messages"),
})
```

## API Endpoints

### POST /api/sms

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

### GET /api/sms/stream

Server-Sent Events endpoint for real-time message delivery. Phone establishes persistent connection on load with phone number. Messages sent via POST /api/sms are instantly broadcast to connected clients.

Query params: `phoneNumber` (required, URL-encoded)

### POST /api/email

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

### GET /api/email/stream

Server-Sent Events endpoint for real-time email delivery. Works identically to SMS stream but for emails.

Query params: `phoneNumber` (required, URL-encoded)

## Important Design Decisions

1. **No Top Padding in Apps**: Apps render full height. Phone component adds `pt-11` to wrapper for StatusBar clearance.

2. **Home Button Visibility**: Only appears when app is active (not on home screen).

3. **Conversation-Based Messages**: Messages grouped by sender. Only full conversations can be deleted, not individual messages.

4. **Session ID System**: Each tab gets unique session ID in sessionStorage for local SMS targeting and multi-instance support.

5. **Phone Number Login**: Optional login enables remote SMS delivery. "Skip" button preserves original local-only behavior.

6. **SSE Real-Time Delivery**: Server maintains Map of active SSE connections per phone number. Messages broadcast instantly. Keep-alive heartbeat every 5 seconds detects dead connections. Auto-cleanup on close.

7. **Location Auto-Request**: Location requested automatically on PhoneProvider mount. Available to all apps immediately via props or hooks.

8. **Custom Mobile Cursor**: CSS cursor styling in `/app/globals.css` creates touch-point appearance for desktop browsers.

## Commit Message Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated releases:

```
<type>(<scope>): <subject>
```

**Types**: `feat`, `fix`, `perf`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore`

**Scopes**: `messages`, `browser`, `phone`, `sms`, `api`, `ui`, `context`, `hooks`

**Examples**:

- `feat(messages): add avatar colors to conversations`
- `fix(phone): correct status bar padding issue`
- `docs: update API documentation`

Breaking changes: Add `!` after type or `BREAKING CHANGE:` in footer.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5 (strict mode)
- **State**: React Context API
- **Real-time**: Server-Sent Events (SSE)
- **Cross-tab**: BroadcastChannel API
- **Storage**: localStorage for message persistence

## Testing SMS Functionality

1. Open `http://localhost:3000` (phone)
2. Login with phone number (e.g., `+12345678901`) or skip for local mode
3. Use embedded SMS Tester (bottom-right corner) or separate tester window
4. Send message - appears as notification on phone
5. Click notification or open Messages app to view
6. Messages persist across page refreshes

For remote testing, use curl or external system:

```bash
curl -X POST http://localhost:3000/api/sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+12345678901",
    "sender": "Marketing System",
    "message": "Test message"
  }'
```

## Known Limitations

1. **Browser App**: Cannot navigate back within iframe (browser security limitation)
2. **SMS Delivery**: Local mode requires same origin (domain/port)
3. **No Server State**: Client-side only, no database, SSE connections are in-memory
4. **Single Device Per Tab**: Each browser tab emulates one phone
5. **Link Detection**: Simple regex for URL parsing

## Styling Conventions

- Tailwind CSS 4 utility classes
- Phone dimensions: 430x875px (iPhone-like proportions)
- Consistent padding: `p-4` for cards, `p-3` for tight areas
- Rounded: `rounded-lg` for cards, `rounded-full` for buttons/avatars
- Shadows: `shadow-lg` for elevation
- Colors: StatusBar icons white, Messages app green, Browser app multi-color Chrome logo
- Custom cursor applied via `globals.css`

## Path Aliases

The project uses `@/` as an alias for the root directory (configured in `tsconfig.json`):

```typescript
import { usePhone } from "@/contexts/PhoneContext"
import { AppProps } from "@/types/app"
import MessagesApp from "@/components/apps/MessagesApp"
```
