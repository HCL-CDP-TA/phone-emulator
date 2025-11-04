# Phone Emulator - Copilot Instructions

## Project Overview

**Purpose**: A realistic smartphone emulator built for demonstrating martech (marketing technology) software on desktop browsers. The primary use case is showcasing SMS marketing campaigns and mobile web experiences without requiring a physical device.

**Key Requirement**: The emulator must be easily extensible - new apps can be added without modifying core infrastructure.

## Original Requirements

1. **Smartphone Replica**: Create a website that replicates a smartphone interface viewable in desktop browsers
2. **SMS Capability**: Ability to "receive" SMS messages triggered via API, displayed as notifications
3. **Browser App**: A functional browser app that uses the native browser's rendering engine (iframe-based)
4. **Modular App System**: All apps must conform to a standard interface to allow easy "installation" of new apps
5. **Navigation**: Clear navigation between apps and home screen
6. **Conversational Messaging**: Messages grouped by sender into conversation threads
7. **Persistence**: Messages stored locally and survive page refreshes
8. **Cross-Tab Communication**: SMS can be sent from separate tester page to phone in different tab/window
9. **Session Isolation**: Multiple users can run the emulator simultaneously without interference
10. **Remote SMS Delivery**: Phone number-based system for receiving SMS from external systems (marketing automation) ✨ NEW
11. **Real-time Delivery**: Server-Sent Events (SSE) for instant message delivery without polling ✨ NEW

## Architecture & Design Patterns

### 1. **Component Architecture**

- **Framework**: Next.js 15 with App Router, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 with custom utilities
- **Structure**: Modular component-based architecture

### 2. **Registry Pattern** (Core Design Pattern)

Location: `/lib/appRegistry.tsx`

All apps are registered in a central registry:

```typescript
interface App {
  id: string
  name: string
  icon: ReactNode
  iconColor: string
  component: React.ComponentType<AppProps>
  category: string
}
```

**Why**: New apps can be added by simply creating a component and adding an entry to the registry - no changes to core Phone component needed.

**How to add a new app**:

1. Create component in `/components/apps/YourApp.tsx`
2. Implement `AppProps` interface (onClose, onSendNotification)
3. Add entry to `appRegistry` array
4. App automatically appears on home screen

### 3. **Context API Pattern** (Global State)

Location: `/contexts/PhoneContext.tsx`

Central state management for:

- Active app tracking
- SMS messages with localStorage persistence
- Notifications
- App navigation (open/close)
- Conversation management (delete conversations)

**Key Functions**:

- `openApp(appId)` - Opens an app
- `closeApp()` - Returns to home screen
- `addSMS()` - Adds message and creates notification
- `markSMSAsRead()` - Marks messages as read
- `deleteConversation(sender)` - Deletes all messages from sender
- `addNotification()` - Shows notification banner

### 4. **BroadcastChannel API** (Cross-Tab Communication)

Location: `/hooks/useSMSReceiver.ts`

**Problem Solved**: SMS tester page needs to send messages to phone emulator in different tab/window.

**Solution**:

- Uses browser's BroadcastChannel API for same-origin communication
- Each phone tab gets unique session ID (stored in sessionStorage)
- Messages are targeted to specific session ID
- Falls back to CustomEvent for same-window compatibility

**Session ID Format**: `session-{timestamp}-{random}`

### 4a. **Server-Sent Events (SSE)** (Real-Time Remote Delivery) ✨ NEW

Location: `/app/api/sms/stream/route.ts`

**Problem Solved**: Marketing automation systems need to send SMS to phone from external systems (different browsers/computers) with instant delivery.

**Solution**:

- Phone logs in with phone number (e.g., `+12345678901`)
- Client opens EventSource connection to `/api/sms/stream?phoneNumber=...`
- Server maintains Map of active connections per phone number
- External API calls (`POST /api/sms` with `phoneNumber`) broadcast instantly via SSE
- Fallback to message queue if no active SSE connection

**Key Features**:

- Instant delivery (no polling delay)
- Keep-alive heartbeat every 5 seconds to detect dead connections
- Automatic cleanup of closed connections
- Fallback to queue-based delivery when phone offline

**Trade-offs**:

- Development: React Strict Mode creates 2 connections (normal, auto-cleans up)
- Production: Single connection per phone
- Server resources: Persistent connections (acceptable for demo use case)

### 5. **Compound Component Pattern** (Phone Shell)

Location: `/components/phone/Phone.tsx`

Phone component orchestrates:

- StatusBar (always visible, z-40)
- App content area (with automatic top padding for StatusBar)
- Home button (visible when app is open)
- NotificationBanner
- HomeScreen (when no app active)

**Design Decision**: Apps don't need to know about StatusBar or home button - Phone component handles all chrome/UI shell concerns.

### 6. **localStorage Persistence**

Location: `/contexts/PhoneContext.tsx` (lines 20-48)

**Implementation**:

- SMS messages automatically saved to localStorage on every change
- Timestamps serialized/deserialized properly
- Key: `phone-sms-messages`
- Loaded on PhoneProvider mount

## File Structure & Key Files

```
/app
  /page.tsx                     - Main entry point with phone number login & SSE connection
  /tester/page.tsx              - SMS tester page (opens in new window)
  /api
    /sms/route.ts               - Main SMS API (tries SSE, falls back to queue)
    /sms/stream/route.ts        - SSE endpoint for real-time delivery ✨ NEW
    /sms/poll/route.ts          - DEPRECATED polling endpoint (backup only)
  /globals.css                  - Custom cursor CSS, animations

/components
  /phone
    /Phone.tsx                  - Main phone shell (handles padding, home button)
    /PhoneNumberLogin.tsx       - Login screen for phone number entry ✨ NEW
    /StatusBar.tsx              - Top status bar (time, battery, signal)
    /HomeScreen.tsx             - App grid, home indicator
    /NotificationBanner.tsx     - Sliding notification display
  /apps
    /MessagesApp.tsx            - Conversation-based messaging with avatars
    /BrowserApp.tsx             - iframe-based web browser
    /[DummyApps].tsx            - Camera, Photos, Clock, etc.
  /SMSTester.tsx                - Minimizable SMS tester (embedded)

/contexts
  /PhoneContext.tsx             - Global state management

/hooks
  /useSMSReceiver.ts            - BroadcastChannel setup, SMS delivery

/lib
  /appRegistry.tsx              - Central app registry (IMPORTANT for extensions)

/types
  /app.ts                       - TypeScript interfaces

/docs
  /REMOTE_SMS.md                - Comprehensive remote SMS feature documentation ✨ NEW
```

## Key Interfaces

```typescript
// All apps must implement this
interface AppProps {
  onClose: () => void
  onSendNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
}

// SMS message structure
interface SMS {
  id: string
  sender: string
  message: string
  timestamp: Date
  read: boolean
}

// App registry entry
interface App {
  id: string // Unique identifier
  name: string // Display name
  icon: ReactNode // JSX icon
  iconColor: string // Tailwind bg color class
  component: ComponentType<AppProps>
  category: string // For organization
}
```

## Important Design Decisions

### 1. **No Top Padding in Apps**

Apps render with full height. The Phone component adds `pt-11` to the app content wrapper to account for StatusBar. This keeps apps simple and unaware of phone chrome.

### 2. **Home Button Visibility**

Home button (white bar at bottom) only appears when an app is active. It's hidden on home screen since it would be redundant.

### 3. **Conversation-Based Messages**

Messages are grouped by sender into conversations. You can only delete entire conversations, not individual messages. This matches typical mobile messaging UX.

### 4. **Avatar Colors**

Each sender gets a consistent color based on hash of their name. 17 colors available. Initials are 1-2 letters (first letter of each word, or first 2 letters if single word).

### 5. **Session ID System**

Each browser tab gets unique session ID in sessionStorage (tab-specific, not shared across tabs). This allows:

- Multiple phone instances in different tabs
- Targeted SMS delivery to specific phone
- Demo/testing scenarios with multiple "phones"

### 6. **Phone Number Login System** ✨ NEW

Users can optionally login with a phone number (e.g., `+12345678901`) to enable remote SMS delivery:

- **Skip mode**: Click "Skip" to use local-only mode (original behavior preserved)
- **Phone number mode**: Enter number to enable remote API delivery
- Phone number stored in localStorage, persists across refreshes
- Logout button to switch phone numbers
- Validation: Must be +[country code][10-15 digits]

### 7. **SSE Real-Time Delivery** ✨ NEW

Server-Sent Events for instant message delivery:

- Client opens persistent connection to `/api/sms/stream`
- Server maintains Map of active connections per phone number
- Messages broadcast instantly when received via API
- Keep-alive heartbeat every 5 seconds detects dead connections
- Automatic cleanup of closed connections
- Fallback to queue if no active connection

**Dev Note**: React Strict Mode creates 2 connections in development (normal behavior). Production has 1 connection.

### 8. **Custom Mobile Cursor**

Location: `/app/globals.css`

Custom CSS cursor (circular touch point) applied to interactive elements for mobile-feel in desktop browser.

## API Endpoints

### POST /api/sms

Send SMS to phone emulator (supports both local and remote delivery)

**Request (Local - same browser)**:

```json
{
  "sender": "Demo Company",
  "message": "Your message here with optional https://links.com"
}
```

**Request (Remote - different browser/computer)** ✨ NEW:

```json
{
  "phoneNumber": "+12345678901",
  "sender": "Demo Company",
  "message": "Your message here"
}
```

**Response**:

```json
{
  "success": true,
  "message": "SMS delivered via SSE",
  "deliveryMethod": "sse", // or "queue" if offline
  "phoneNumber": "+12345678901",
  "data": {
    "sender": "Demo Company",
    "message": "Your message here",
    "timestamp": "2024-11-04T12:00:00Z"
  }
}
```

**Delivery Methods**:

- **No phoneNumber**: BroadcastChannel to same-browser tabs
- **With phoneNumber + active SSE**: Instant delivery via Server-Sent Events
- **With phoneNumber + offline**: Queued for polling fallback (deprecated)

### GET /api/sms/stream ✨ NEW

Server-Sent Events endpoint for real-time message delivery

**Usage**:

```javascript
const eventSource = new EventSource("/api/sms/stream?phoneNumber=%2B12345678901")
eventSource.onmessage = event => {
  const { sender, message } = JSON.parse(event.data)
  // Handle message
}
```

**Query Parameters**:

- `phoneNumber` (required): URL-encoded phone number (e.g., `%2B12345678901`)

**Event Stream**:

- Connection message: `{ type: "connected", phoneNumber: "..." }`
- SMS message: `{ sender: "...", message: "...", timestamp: 1234567890 }`
- Keep-alive: `: keepalive` (every 5 seconds)

### GET /api/sms/poll (DEPRECATED)

⚠️ **This endpoint is deprecated**. Client now uses SSE for real-time delivery. Kept as backup only.

Polling endpoint for retrieving queued messages (fallback mechanism)

**Query Parameters**:

- `phoneNumber` (required): Phone number
- `since` (optional): Unix timestamp - only return messages after this time

**Response**:

```json
{
  "success": true,
  "phoneNumber": "+12345678901",
  "messages": [{ "sender": "...", "message": "...", "timestamp": 1234567890 }],
  "count": 1
}
```

## Common Tasks

### Add a New App

1. Create `/components/apps/YourApp.tsx`:

```typescript
"use client"
import { AppProps } from "@/types/app"

export default function YourApp({ onClose }: AppProps) {
  return (
    <div className="flex flex-col h-full bg-white">{/* Your app UI - gets full height, don't add top padding */}</div>
  )
}
```

2. Add to `/lib/appRegistry.tsx`:

```typescript
{
  id: 'yourapp',
  name: 'Your App',
  icon: <svg>...</svg>,
  iconColor: 'bg-purple-500',
  component: YourApp,
  category: 'utility',
}
```

### Access Phone Context in App

```typescript
import { usePhone } from "@/contexts/PhoneContext"

const { smsMessages, openApp, addNotification } = usePhone()
```

### Send Notification from App

```typescript
onSendNotification({
  appId: "messages",
  appName: "Messages",
  title: "New Message",
  message: "Hello!",
  onClick: () => openApp("messages"),
})
```

### Open Tester Page

Click "SMS Tester" button in top-right of phone emulator. Opens in new window with session ID pre-configured.

## Testing & Development

### Local Development

```bash
npm run dev
# Opens on http://localhost:3000
```

### Test SMS Flow

1. Open `http://localhost:3000` (phone)
2. Click "SMS Tester" button (opens new window)
3. Send message from tester
4. Message appears as notification on phone
5. Click notification or open Messages app
6. See conversation with avatar and messages

### Test Persistence

1. Send some messages
2. Refresh page
3. Messages should persist (localStorage)

### Test Cross-Tab

1. Open phone in Tab A
2. Open phone in Tab B (different session ID)
3. Open tester from Tab A
4. Send message - only Tab A receives it
5. Open tester from Tab B
6. Send message - only Tab B receives it

## Styling Conventions

- **Tailwind CSS 4**: Use utility classes
- **Colors**: Status bar icons white, Messages green, Browser blue
- **Spacing**: Consistent padding (p-4 for cards, p-3 for tight areas)
- **Rounded**: rounded-lg for cards, rounded-full for buttons/avatars
- **Shadows**: shadow-lg for elevated elements
- **Phone Dimensions**: 430x875px (iPhone-like proportions)
- **Home Button**: w-32 h-1.5, white, rounded-full
- **Custom Cursor**: Applied globally via globals.css

## Known Limitations

1. **Browser App**: Cannot navigate back within iframe (browser limitation)
2. **SMS Delivery**: Requires same origin (same domain/port)
3. **No Server State**: Everything is client-side, no database
4. **Single Device**: Emulates one phone at a time per tab
5. **Link Detection**: Simple regex, may not catch all URL formats

## Future Extension Ideas

- Voice call simulation
- Push notification simulation
- Photo gallery with image uploads
- Settings app with preferences
- Dark mode support
- Multiple phone models (different sizes)
- Record/replay demo scenarios

## Troubleshooting

### Messages not appearing

- Check BroadcastChannel is supported (modern browsers)
- Verify session ID matches between phone and tester
- Check browser console for errors

### Apps not showing

- Verify app is in `appRegistry.tsx`
- Check component export is default export
- Ensure AppProps interface is implemented

### Home button not visible

- Only shows when app is active (not on home screen)
- Check z-index (should be z-50)
- Verify activeApp state in PhoneContext

### Top padding issues

- Apps should NOT add their own top padding
- Phone.tsx adds pt-11 to app wrapper
- If content hidden behind StatusBar, check for conflicting padding

## Commit Message Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated releases with release-please.

**IMPORTANT**: All commits MUST follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

**ALWAYS use these prefixes** for commits:

- **feat**: A new feature (triggers minor version bump)

  - Example: `feat(messages): add avatar colors to conversations`
  - Example: `feat(browser): add back and refresh navigation buttons`

- **fix**: A bug fix (triggers patch version bump)

  - Example: `fix(phone): correct status bar padding issue`
  - Example: `fix(sms): resolve cross-tab message delivery`

- **perf**: Performance improvements

  - Example: `perf(messages): optimize conversation list rendering`

- **docs**: Documentation changes

  - Example: `docs: update README with setup instructions`
  - Example: `docs(api): add SMS endpoint documentation`

- **style**: Code style changes (formatting, no code logic change)

  - Example: `style: apply prettier formatting`

- **refactor**: Code refactoring (no functional changes)

  - Example: `refactor(apps): extract avatar component to shared utility`

- **test**: Adding or updating tests

  - Example: `test(messages): add conversation deletion tests`

- **build**: Build system or dependency updates

  - Example: `build: update Next.js to 15.1.0`

- **ci**: CI/CD configuration changes

  - Example: `ci: add release-please workflow`

- **chore**: Maintenance tasks
  - Example: `chore: update gitignore`

### Breaking Changes

For breaking changes, add `!` after the type or add `BREAKING CHANGE:` in the footer:

```
feat(api)!: change SMS endpoint response format

BREAKING CHANGE: The API now returns timestamps in ISO format instead of Unix epoch
```

### Scope

The scope should indicate which part of the codebase is affected:

- `messages` - Messages app
- `browser` - Browser app
- `phone` - Phone shell/container
- `sms` - SMS functionality
- `api` - API endpoints
- `ui` - General UI components
- `context` - Context/state management
- `hooks` - Custom hooks

### Examples of Good Commits

✅ `feat(messages): add delete conversation functionality`
✅ `fix(phone): adjust padding to prevent content overlap with status bar`
✅ `feat(sms): implement BroadcastChannel for cross-tab communication`
✅ `refactor(apps): create centralized app registry pattern`
✅ `docs: add copilot instructions with architecture details`
✅ `perf(messages): memoize conversation list calculations`

### Examples of Bad Commits (DON'T USE)

❌ `update code` (no type, vague)
❌ `fixed bug` (no scope, vague)
❌ `WIP` (not descriptive)
❌ `changes` (not descriptive)
❌ `Add feature` (incorrect capitalization)

### When Making Changes

**Before committing**, ensure your commit message:

1. Starts with a valid type (feat, fix, docs, etc.)
2. Includes a scope in parentheses when applicable
3. Has a clear, concise subject in present tense
4. Subject is lowercase after the type
5. No period at the end of the subject

## Code Quality Standards

- **TypeScript**: Strict mode, no `any` types
- **React**: Functional components with hooks
- **Performance**: Use `useCallback` and `useMemo` for expensive operations
- **Accessibility**: Include aria-labels on icon buttons
- **Error Handling**: Try-catch around localStorage operations
- **Naming**: Descriptive names, follow React conventions (use prefix for hooks)
- **Commits**: ALWAYS follow Conventional Commits format (see above)

## Getting Help

- Check existing apps for patterns (MessagesApp.tsx is comprehensive example)
- Review PhoneContext for available state/functions
- Test with SMS tester page for realistic scenarios
- Browser DevTools → Application → Storage → sessionStorage to see session ID

---

**Last Updated**: November 2025
**Version**: 1.0
**Maintainer**: GitHub Copilot Team
