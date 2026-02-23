# Architecture

## Core Design Patterns

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

**4. USSD Dialer System**

The emulator includes a fully interactive USSD (Unstructured Supplementary Service Data) simulation engine:

- **Configurable Menu Tree**: USSD service menus are defined as a recursive `USSDNode` tree in `ussd-config.json` in the project root. The file is read on server start and written on Save.
- **In-Memory Sessions**: Each USSD session is held in a server-side Map with a 5-minute timeout. No database required.
- **Dialer App**: `DialerApp.tsx` is the first app on the home screen. White background, grey T9 keypad. Typing a code ending with `#` auto-triggers a USSD session. `*#06#` shows the device IMEI locally.
- **Auto-Fire on Keypress**: When the current node presents numbered options, pressing a digit sends it immediately. Free-text input nodes (`isInput: true`) accumulate digits and send when the green button is tapped.
- **goto Pattern**: Nodes can redirect to another root USSD code via `{ goto: "*100#", response: "" }` rather than duplicating an entire sub-tree for "Back to Main Menu" options.
- **HCL CDP Integration**: Nodes with `cdpEvent` fire track events via `@hcl-cdp-ta/cdp-node-sdk`. Non-fatal if `CDP_API_KEY`/`CDP_PASS_KEY` are absent.
- **Config Editor**: `/ussd-config` page (teal/green theme). Recursive node tree on the left, node editor on the right. Supports Save, Export JSON, Import JSON, and Load Defaults.
- **Operator Header**: A green header bar in the dialer always shows the `networkName` from the config (e.g., "Safaricom"). This header is always present regardless of which service is active.
- **Default Demo Config**: `ussd-config.json` ships with `*100#` (Safaricom self-service), `*544#` (data bundles), and `*247#` (Equity Bank Kenya).

Key Components:
- `DialerApp.tsx`: Dialer UI and USSD session orchestration
- `/app/api/ussd/session/route.ts`: POST (new/continue session), DELETE (end session)
- `/app/api/ussd/config/route.ts`: GET/POST/DELETE config; exports `getUSSDConfig()` singleton
- `/app/ussd-config/page.tsx`: Visual config editor
- `/types/ussd.ts`: `USSDNode`, `USSDConfig`, `USSDSession`, `USSDSessionResponse`, `USSDCDPEvent`
- `/lib/ussdDefaults.ts`: Minimal cold-start fallback config
- `/ussd-config.json`: Live config file (in project root, not in `/lib`)

**5. Push Notification System**

Push notifications are distinct from SMS/email - they target a specific app by ID and support rich content:

- **SSE Delivery**: Real-time delivery via `/api/push/stream` (same pattern as SMS/email)
- **App Targeting**: Each notification specifies an `appId` to resolve the correct icon and color
- **Rich Content**: Supports optional `imageUrl` (displayed as h-32 banner) and up to 3 `actionButtons`
- **Action Buttons**: Clicking a button stores the URL in `localStorage` as `app-navigate-{appId}`, fires a `app-navigate` CustomEvent, then opens the target app - allowing apps to deep-link on open
- **App Resolution**: `usePushReceiver` resolves icon/color by searching appRegistry, SOCIAL_APPS, GEOFENCE_APPS, then custom geofence apps from localStorage
- **Tester UI**: `/push-tester` page (orange theme) accessible from settings dropdown; includes interactive form, app selector, and live curl example
- **Notification Banner**: Icon shape is `rounded-full`; app name shown in gray; title bold; images and action buttons rendered below the body text

**6. Phone Shell Component Pattern**

The `Phone.tsx` component orchestrates the UI shell:

- StatusBar (always visible, z-40)
- App content area (automatic padding for StatusBar)
- Home button (visible only when app is open)
- NotificationBanner
- HomeScreen (when no app active)

**Apps don't manage chrome/shell concerns** - they receive full height and the Phone component handles all padding and navigation UI.

**7. Social Media Integration**

Social media apps (Facebook, Instagram, X, LinkedIn, TikTok) use a webview-based architecture:

- **Configuration-driven**: Apps defined in `socialAppsConfig.ts` with paths, icon names, and colors
- **Dynamic URL generation**: `makeSocialAppComponent()` creates app components with URLs including demo key and user identifier (phone number)
- **Iframe embedding**: `SocialWebviewApp.tsx` embeds external social media content in sandboxed iframes
- **In-app browser**: PostMessage API enables social apps to open links in an overlay browser within the phone
- **Environment-based**: Configurable via `NEXT_PUBLIC_SOCIAL_APP_KEY` and `NEXT_PUBLIC_SOCIAL_APP_BASE_URL`

The system supports custom social media backends that can send postMessage events (`type: "open-url"`) to open URLs within the phone interface.

**8. Location Simulation System**

The emulator includes a sophisticated location override system for testing location-based features:

- **Real GPS Support**: Uses browser Geolocation API for real device location
- **Static Overrides**: Set fixed latitude/longitude coordinates
- **Route Playback**: Animate movement along pre-defined waypoints with smooth interpolation
- **Visual Map Panel**: Leaflet.js-based map viewer shows real-time location tracking
- **Location Presets**: Centrally managed static locations and routes stored in PostgreSQL database
- **Interactive Preset Configuration**: Click-to-create interface for building presets with live map preview
- **Geofence Display**: Read-only geofence zones from external API shown on location-config map
- **Location Search**: Geocoding integration (Nominatim) for finding locations by name
- **Geofence Demo**: Test app for geofence entry/exit events
- **Effective Location Pattern**: Apps always use `effectiveLocation` which seamlessly switches between real GPS and overrides
- **PostMessage Broadcasting**: Location updates automatically broadcast to iframes (BrowserApp, SocialWebviewApp)

Key Components:
- `MapPanel.tsx`: Side-by-side map viewer with route controls (play/pause, position slider)
- `LocationConfigMap.tsx`: Interactive map for creating/editing presets with click-to-add functionality
- `PresetPanel.tsx`: Preset management sidebar with search, forms, and preset list
- `GeofenceLayer.tsx`: Renders read-only geofence polygons from external API (non-interactive)
- `RouteBuilder.tsx`: Floating controls for route creation (waypoint count, undo, finish)
- `PhoneContext.effectiveLocation`: Computed location (override or real GPS) exposed to all components
- `locationUtils.ts`: Haversine distance calculation, heading computation, point-in-polygon checking
- `locationPresetValidation.ts`: Shared validation logic for preset API endpoints
- `prisma.ts`: Prisma client singleton for database connections
- `geofencePresets.ts`: Default geofence zones for testing
- `useGeofences.ts`: Hook to fetch geofences from external API with bearer token support
- `useGeocoding.ts`: Hook for location search with 500ms debouncing
- Route animation runs at 100ms intervals with linear interpolation between waypoints
- Map updates smoothly (0.2s animation) on every position change

Status Indicators:
- Blue dot in StatusBar when location override is active
- Map visibility toggleable via Map button in top-left corner
- Coordinate display shows lat/lng/accuracy/speed/heading/altitude in real-time

## Key Interfaces

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

// Push notification action button
interface NotificationActionButton {
  id: string
  label: string
  url: string // Opens in BrowserApp when tapped; empty string = dismiss only
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

// Coordinate for polygon vertices
interface Coordinate {
  lat: number
  lng: number
}

// Geofence zone definition (polygon-based)
interface GeofenceZone {
  id: string
  name: string
  description?: string
  coordinates: Coordinate[] // Polygon vertices
}

// Geofence from external API (for location-config screen)
interface Geofence {
  id: string
  name: string
  coordinates: Coordinate[] // Polygon vertices
  enabled?: boolean
  createdAt?: string
  updatedAt?: string
}

// CDP event attached to a USSD node
interface USSDCDPEvent {
  eventId: string
  properties?: Record<string, string | number | boolean>
}

// A single node in the USSD menu tree
interface USSDNode {
  response: string                        // Text shown to the user
  options?: Record<string, USSDNode>      // Keyed by digit; "*" = wildcard for free-text input
  isInput?: boolean                       // true = accumulate digits, send on green button
  cdpEvent?: USSDCDPEvent                 // Fires when this node is reached
  sessionEnd?: boolean                    // true = session terminates after this response
  goto?: string                           // Redirect to another root code (e.g. "*100#")
}

// Top-level USSD configuration
interface USSDConfig {
  codes: Record<string, USSDNode>         // Keys are USSD codes e.g. "*100#"
  networkName?: string                    // Operator name shown in dialer header
}

// Server-side session (in-memory)
interface USSDSession {
  sessionId: string
  phoneNumber: string
  currentNode: USSDNode
  rootCode: string
  history: string[]
  startedAt: number
}

// Response returned by /api/ussd/session
interface USSDSessionResponse {
  sessionId: string | null               // null when session has ended
  response: string
  sessionActive: boolean
  requiresInput: boolean
  networkName: string
}
```

## File Structure

```
/app
  /page.tsx                     - Main entry: phone number login + SSE connection + map viewer + control buttons
  /tester/page.tsx              - SMS tester (opens in new window)
  /email-tester/page.tsx        - Email tester (opens in new window)
  /push-tester/page.tsx         - Push notification tester (opens in new window)
  /location-config/page.tsx     - Location preset configuration (CRUD for static/route presets)
  /ussd-config/page.tsx         - USSD config editor (teal theme, recursive node tree + node editor)
  /api/sms/route.ts             - Main SMS API (SSE + queue fallback)
  /api/sms/stream/route.ts      - SSE endpoint for real-time delivery
  /api/sms/poll/route.ts        - DEPRECATED polling fallback
  /api/email/route.ts           - Email API endpoint
  /api/email/stream/route.ts    - Email SSE endpoint for real-time delivery
  /api/push/route.ts            - Push notification API (POST, requires phoneNumber + active SSE)
  /api/push/stream/route.ts     - Push SSE endpoint for real-time delivery
  /api/location-presets/route.ts       - Location presets API (GET all, POST create)
  /api/location-presets/[id]/route.ts  - Single preset API (GET, PUT, DELETE)
  /api/ussd/session/route.ts    - USSD session API (POST new/continue, DELETE end session)
  /api/ussd/config/route.ts     - USSD config API (GET, POST replace, DELETE reset to defaults)

/components
  /phone
    /Phone.tsx                  - Phone shell (padding, home button, chrome)
    /PhoneNumberLogin.tsx       - Phone number entry screen
    /StatusBar.tsx              - Status bar (time, battery, signal, location indicator)
    /HomeScreen.tsx             - App grid
    /NotificationBanner.tsx     - Sliding notification display
    /MapPanel.tsx               - Leaflet.js map viewer with route controls
  /location-config
    /LocationConfigMap.tsx      - Interactive map for creating/editing presets with "My Location" button
    /PresetPanel.tsx            - Right sidebar with search, forms, and preset list
    /GeofenceLayer.tsx          - Renders read-only geofence polygons from API
    /RouteBuilder.tsx           - Floating controls for route creation (waypoint count, undo, finish)
  /apps
    /DialerApp.tsx              - Phone dialer + USSD session UI (first app in registry)
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
  /usePushReceiver.ts           - Push notification SSE connection hook
  /useLocation.ts               - Location access hook
  /useGeofences.ts              - Fetch geofences from external API (with bearer token support)
  /useGeocoding.ts              - Nominatim API integration for location search (debounced)

/lib
  /appRegistry.tsx              - Central app registry (CRITICAL for extensions)
  /locationUtils.ts             - Haversine distance, heading calculation, geofence checking
  /locationPresetValidation.ts  - Validation logic for location preset API endpoints
  /prisma.ts                    - Prisma client singleton (prevents connection pool exhaustion)
  /geofencePresets.ts           - Default geofence zones (3 zones)
  /debounce.ts                  - Utility function for debouncing user input (used in search)
  /ussdDefaults.ts              - Minimal cold-start fallback USSD config (used when no ussd-config.json)

/prisma
  /schema.prisma                - Database schema (LocationPreset model, PresetType enum)

/types
  /app.ts                       - TypeScript interfaces (includes LocationOverride, LocationPreset, GeofenceZone)
  /ussd.ts                      - USSD interfaces (USSDNode, USSDConfig, USSDSession, USSDSessionResponse, USSDCDPEvent)

/ussd-config.json               - Live USSD config file (project root). Loaded at server start, written on Save.
```
