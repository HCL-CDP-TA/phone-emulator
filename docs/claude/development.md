# Common Development Tasks

## Adding a New App

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

## Adding a Social Media App

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

## Using Location Services

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

## Accessing Phone Context

```tsx
import { usePhone } from "@/contexts/PhoneContext"

const {
  smsMessages,
  openApp,
  addNotification,
  effectiveLocation,  // Use this for location
  locationOverride,
  setLocationOverrideConfig,
} = usePhone()
```

## Sending Notifications from Apps

```tsx
onSendNotification({
  appId: "messages",
  appName: "Messages",
  title: "New Message",
  message: "Hello!",
  onClick: () => openApp("messages"),
})
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
   - **Custom Presets**: Any presets created via the Location Config screen
4. Status bar shows blue dot when location override is active

**Route Playback Controls:**

When a route is selected, the map panel displays:
- **Play/Pause Button**: Start/stop automatic route animation
- **Position Slider**: Manually scrub through the route (map updates in real-time)
- **Coordinate Display**: Real-time lat/lng, speed, heading, accuracy

**Creating Custom Presets:**

The Location Config screen (`/location-config`) provides an interactive map-based interface for creating and editing location presets:

1. **Access**: Open "Location Config" from the settings dropdown (top-right)
2. **Layout**: Split-screen with interactive map (60%) on left, preset management panel (40%) on right
3. **Map centers on your current location** automatically when opened
4. **"My Location" button** (top-right of map) to recenter on your GPS position

**Creating Static Locations:**
- Click "Add Static Location" button in the right panel
- Click anywhere on the map to set the location (green marker appears)
- Click again to update the position while creating
- Enter name and description in the form
- Click "Save" to add to presets, or "Cancel" to discard

**Creating Routes:**
- Click "Add Route" button in the right panel
- Click multiple points on the map to build a route (numbered blue markers appear)
- Polyline connects waypoints in real-time
- Use "Undo" button to remove last waypoint
- Minimum 2 waypoints required
- Enter name, description, and loop setting in the form
- Click "Finish Route" when done, or "Cancel" to discard

**Editing Existing Presets:**
- Click "Edit" on any preset in the list
- For static locations: Green marker appears, click map to update position
- For routes: All waypoints shown with polyline, click map to add more waypoints
- Update name/description in form
- Click "Save Changes" to update, or "Cancel" to discard

**Additional Features:**
- **Location Search**: Type location names (e.g., "Sydney Opera House") in search bar to navigate map (doesn't create presets)
- **Geofence Display**: Read-only geofence zones from external API displayed as dashed blue polygons
- **Delete Presets**: Click "Delete" button on any preset
- All presets saved to PostgreSQL database and immediately available across all users/sessions

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
- Geofence detection uses ray casting algorithm for point-in-polygon checks

**Location Config Implementation:**

- State machine architecture with three modes: `idle`, `creating-static`, `creating-route`
- Dynamic import for LocationConfigMap to avoid SSE issues with Leaflet
- Geofence polygons rendered with `interactive={false}` to allow click-through for waypoint placement
- Location search uses Nominatim API with 500ms debounce to reduce API calls
- Green marker for static locations (CSS filter: `hue-rotate(90deg) saturate(2)`)
- Numbered DivIcons for route waypoints (blue circles with white numbers)
- Polyline preview updates in real-time as waypoints are added
- Map cursor changes to crosshair during creation (inline style for higher specificity than Leaflet CSS)
- Visual editing: Opening existing preset shows it on map in creation mode for easy modification
- ESC key cancels current creation/edit operation
- Toast notifications provide feedback for all user actions
- Geofences fetched from `${GEOFENCE_API_URL}/api/public/geofences` with optional bearer token support
