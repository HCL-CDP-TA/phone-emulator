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

**5. Social Media Integration**

Social media apps (Facebook, Instagram, X, LinkedIn, TikTok) use a webview-based architecture:

- **Configuration-driven**: Apps defined in `socialAppsConfig.ts` with paths, icon names, and colors
- **Dynamic URL generation**: `makeSocialAppComponent()` creates app components with URLs including demo key and user identifier (phone number)
- **Iframe embedding**: `SocialWebviewApp.tsx` embeds external social media content in sandboxed iframes
- **In-app browser**: PostMessage API enables social apps to open links in an overlay browser within the phone
- **Environment-based**: Configurable via `NEXT_PUBLIC_SOCIAL_APP_KEY` and `NEXT_PUBLIC_SOCIAL_APP_BASE_URL`

The system supports custom social media backends that can send postMessage events (`type: "open-url"`) to open URLs within the phone interface.

**6. Location Simulation System**

The emulator includes a sophisticated location override system for testing location-based features:

- **Real GPS Support**: Uses browser Geolocation API for real device location
- **Static Overrides**: Set fixed latitude/longitude coordinates
- **Route Playback**: Animate movement along pre-defined waypoints with smooth interpolation
- **Visual Map Panel**: Leaflet.js-based map viewer shows real-time location tracking
- **Location Presets**: Pre-configured static locations and routes stored in localStorage
- **Geofence Demo**: Test app for geofence entry/exit events
- **Effective Location Pattern**: Apps always use `effectiveLocation` which seamlessly switches between real GPS and overrides
- **PostMessage Broadcasting**: Location updates automatically broadcast to iframes (BrowserApp, SocialWebviewApp)

**Key Components:**

- `MapPanel.tsx`: Side-by-side map viewer with route controls (play/pause, position slider)
- `PhoneContext.effectiveLocation`: Computed location (override or real GPS) exposed to all components
- `locationUtils.ts`: Haversine distance calculation, heading computation, geofence checking
- `locationPresets.ts`: Default static locations and routes (San Francisco, NYC, London)
- `geofencePresets.ts`: Default geofence zones for testing
- Route animation runs at 100ms intervals with linear interpolation between waypoints
- Map updates smoothly (0.2s animation) on every position change

**Status Indicators:**

- Blue dot in StatusBar when location override is active
- Map visibility toggleable via Map button in top-left corner
- Coordinate display shows lat/lng/accuracy/speed/heading/altitude in real-time

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

// Location override configuration
interface LocationOverride {
  enabled: boolean
  mode: "static" | "route"
  staticPosition?: {
    latitude: number
    longitude: number
    accuracy?: number
    altitude?: number | null
    altitudeAccuracy?: number | null
    heading?: number | null
    speed?: number | null
  }
  route?: {
    id: string
    name: string
    waypoints: Array<{
      latitude: number
      longitude: number
      speed?: number
    }>
    currentWaypointIndex: number
    progress: number // 0.0 to 1.0 interpolation between current and next waypoint
    isPlaying: boolean
    loop: boolean
  }
}

// Location preset for configuration
interface LocationPreset {
  id: string
  name: string
  description?: string
  type: "static" | "route"
  latitude?: number // for static locations
  longitude?: number // for static locations
  waypoints?: Array<{
    latitude: number
    longitude: number
    speed?: number
  }> // for route locations
}

// Geofence zone definition
interface GeofenceZone {
  id: string
  name: string
  description?: string
  latitude: number
  longitude: number
  radiusMeters: number
}
```

## File Structure

```
/app
  /page.tsx                     - Main entry: phone number login + SSE connection + map viewer + control buttons
  /tester/page.tsx              - SMS tester (opens in new window)
  /email-tester/page.tsx        - Email tester (opens in new window)
  /location-config/page.tsx     - Location preset configuration (CRUD for static/route presets)
  /api/sms/route.ts             - Main SMS API (SSE + queue fallback)
  /api/sms/stream/route.ts      - SSE endpoint for real-time delivery
  /api/sms/poll/route.ts        - DEPRECATED polling fallback
  /api/email/route.ts           - Email API endpoint
  /api/email/stream/route.ts    - Email SSE endpoint for real-time delivery

/components
  /phone
    /Phone.tsx                  - Phone shell (padding, home button, chrome)
    /PhoneNumberLogin.tsx       - Phone number entry screen
    /StatusBar.tsx              - Status bar (time, battery, signal, location indicator)
    /HomeScreen.tsx             - App grid
    /NotificationBanner.tsx     - Sliding notification display
    /MapPanel.tsx               - Leaflet.js map viewer with route controls
  /apps
    /MessagesApp.tsx            - Conversation-based messaging with avatars
    /EmailApp.tsx               - HTML email with DOMPurify sanitization, notifications
    /BrowserApp.tsx             - iframe-based web browser with address bar + location forwarding
    /MapsApp.tsx                - Location-enabled maps using OpenStreetMap
    /GeofenceApp.tsx            - Geofence demo app for testing enter/exit events
    /SocialWebviewApp.tsx       - Webview component for social media apps + location forwarding
    /socialAppsConfig.ts        - Configuration for social media apps (Facebook, Instagram, X, LinkedIn, TikTok)
    /socialIcons.tsx            - SVG icons for social media apps
    /[DummyApps].tsx            - Camera, Photos, Clock, Calculator, etc.

/contexts
  /PhoneContext.tsx             - Global state management + location override system

/hooks
  /useSMSReceiver.ts            - BroadcastChannel setup, SMS delivery
  /useEmailReceiver.ts          - Email SSE connection hook
  /useLocation.ts               - Location access hook

/lib
  /appRegistry.tsx              - Central app registry (CRITICAL for extensions)
  /locationUtils.ts             - Haversine distance, heading calculation, geofence checking
  /locationPresets.ts           - Default location presets (3 static, 2 routes)
  /geofencePresets.ts           - Default geofence zones (3 zones)

/types
  /app.ts                       - TypeScript interfaces (includes LocationOverride, LocationPreset, GeofenceZone)
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

### Adding a Social Media App

Social media apps use a configuration-driven approach. To add a new social platform:

1. **Add configuration** (`/components/apps/socialAppsConfig.ts`):

```typescript
export const SOCIAL_APPS = [
  // ... existing apps
  {
    id: "newsocial",
    name: "NewSocial",
    path: "newsocial", // URL path on backend
    iconName: "NewSocial",
    iconColor: "bg-purple-600",
  },
]
```

2. **Add icon** (`/components/apps/socialIcons.tsx`):

```tsx
export const socialIcons = {
  // ... existing icons
  NewSocial: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
      {/* SVG path */}
    </svg>
  ),
}
```

3. **Configure environment variables** (`.env.local`):

```bash
NEXT_PUBLIC_SOCIAL_APP_KEY=your-demo-key
NEXT_PUBLIC_SOCIAL_APP_BASE_URL=https://your-backend.com
```

The app will automatically appear on the home screen and open the URL: `${baseUrl}/${path}?demo_key=${key}&user=${phoneNumber}`

**Backend Integration**: The social backend can send postMessage events to open links in the in-app browser:

```javascript
window.parent.postMessage({ type: "open-url", url: "https://example.com" }, "*")
```

### Using Location Services

Location is automatically requested when the phone loads. Apps should **always use `effectiveLocation`** from PhoneContext, which seamlessly switches between real GPS and overrides:

```tsx
import { usePhone } from "@/contexts/PhoneContext"

// RECOMMENDED: Use effectiveLocation for location-aware apps
const { effectiveLocation, locationOverride } = usePhone()

if (effectiveLocation) {
  const { latitude, longitude } = effectiveLocation.coords
  const { speed, heading, accuracy } = effectiveLocation.coords
  // This automatically uses override location if active, otherwise real GPS
}

// Check if location is being simulated
if (locationOverride.enabled) {
  console.log(`Using ${locationOverride.mode} location override`)
}
```

**Setting Location Overrides:**

```tsx
const { setLocationOverrideConfig } = usePhone()

// Static location override
setLocationOverrideConfig({
  enabled: true,
  mode: "static",
  staticPosition: {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
})

// Route playback override
setLocationOverrideConfig({
  enabled: true,
  mode: "route",
  route: {
    id: "my-route",
    name: "My Route",
    waypoints: [
      { latitude: 37.7749, longitude: -122.4194 },
      { latitude: 37.7849, longitude: -122.4294, speed: 10 },
      { latitude: 37.7949, longitude: -122.4394, speed: 10 },
    ],
    currentWaypointIndex: 0,
    progress: 0,
    isPlaying: true,
    loop: false,
  },
})

// Disable override (use real GPS)
setLocationOverrideConfig({ enabled: false })
```

**Legacy location access** (use effectiveLocation instead):

```tsx
import { useLocation } from "@/hooks/useLocation"

const { position, error, isLoading, requestLocation } = useLocation()
// Note: This only returns real GPS, not overrides
```

### Accessing Phone Context

```tsx
import { usePhone } from "@/contexts/PhoneContext"

const {
  smsMessages,
  openApp,
  addNotification,
  effectiveLocation, // Use this for location
  locationOverride,
  setLocationOverrideConfig,
} = usePhone()
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

**Scopes**: `messages`, `email`, `browser`, `phone`, `sms`, `social`, `api`, `ui`, `context`, `hooks`, `location`, `maps`

**Examples**:

- `feat(messages): add avatar colors to conversations`
- `fix(phone): correct status bar padding issue`
- `feat(social): add TikTok integration`
- `feat(location): add route playback with smooth interpolation`
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
- **Social Integration**: Iframe webviews with PostMessage API
- **Maps**: Leaflet.js with React-Leaflet for interactive maps
- **Location**: Browser Geolocation API with override system

## Social Media Apps

The emulator includes five pre-configured social media apps:

1. **Facebook** - Blue icon with Facebook logo
2. **Instagram** - Gradient icon (yellow/pink/purple) with Instagram logo
3. **X (Twitter)** - Black icon with X logo
4. **LinkedIn** - Blue icon with LinkedIn logo
5. **TikTok** - White icon with TikTok logo

Each app:

- Opens in a sandboxed iframe pointing to external backend
- Receives phone number as `user` parameter for personalization
- Requires `demo_key` parameter for authentication
- Can open external links in an in-app browser overlay via postMessage

**Environment Configuration** (`.env.local`):

```bash
# Demo key for social app backend authentication
NEXT_PUBLIC_SOCIAL_APP_KEY=your-demo-key

# Backend base URL (defaults to HCL demo server)
NEXT_PUBLIC_SOCIAL_APP_BASE_URL=https://social.demo.now.hclsoftware.cloud
```

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

## Testing Location Functionality

**Using the UI Controls:**

1. Open `http://localhost:3000` (phone emulator)
2. Click the **Map** button (top-left corner) to show the map viewer alongside the phone
3. Click the **Location** button (pin icon, top-left) to select a preset:
   - **Real GPS**: Use actual device location
   - **Static Locations**: San Francisco Downtown, Times Square, Tower of London
   - **Routes**: SF to Golden Gate, NYC to Central Park
4. Status bar shows blue dot when location override is active

**Route Playback Controls:**

When a route is selected, the map panel displays:

- **Play/Pause Button**: Start/stop automatic route animation
- **Position Slider**: Manually scrub through the route (map updates in real-time)
- **Coordinate Display**: Real-time lat/lng, speed, heading, accuracy

**Creating Custom Presets:**

1. Open "Location Config" from the settings dropdown (top-right)
2. Add static location or route with waypoints
3. Saved to localStorage and available in location selector

**Testing Location in Apps:**

- **MapsApp**: Opens OpenStreetMap at current effective location
- **GeofenceApp**: Demo app showing enter/exit events for preset zones
- **BrowserApp/SocialWebviewApp**: Location automatically forwarded via postMessage
- Any app using `effectiveLocation` from PhoneContext

**Technical Details:**

- Route animation runs at 100ms intervals (1% progress per tick)
- Smooth interpolation between waypoints using linear math
- Map animates with 0.2s duration on position changes
- Heading calculated using Haversine formula
- Geofence detection uses great-circle distance

## Known Limitations

1. **Browser App**: Cannot navigate back within iframe (browser security limitation)
2. **SMS Delivery**: Local mode requires same origin (domain/port)
3. **No Server State**: Client-side only, no database, SSE connections are in-memory
4. **Single Device Per Tab**: Each browser tab emulates one phone
5. **Link Detection**: Simple regex for URL parsing
6. **Social Apps**: Require external backend, iframe sandbox restrictions apply, postMessage only works from same-origin or with proper CORS

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
