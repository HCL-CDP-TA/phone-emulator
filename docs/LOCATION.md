# Location Services Documentation

## Overview

The phone emulator supports browser-based geolocation services, allowing apps to access the user's real device location. This feature uses the browser's native Geolocation API and respects user permissions.

**Location is automatically requested when the phone loads**, making it immediately available to all apps without requiring individual apps to request it.

## Architecture

### Components

1. **PhoneContext** (`/contexts/PhoneContext.tsx`)

   - Manages global location state
   - Automatically requests location on phone mount
   - Provides location request and watch functions
   - Handles permission state

2. **useLocation Hook** (`/hooks/useLocation.ts`)

   - Convenient hook for apps to access location
   - Supports one-time requests and continuous watching
   - Automatic cleanup of watch subscriptions

3. **AppProps Interface** (`/types/app.ts`)
   - Apps receive location via props from Phone component
   - Optional location data passed to all apps

### Location State

```typescript
interface LocationState {
  position: GeolocationPosition | null
  error: GeolocationPositionError | null
  isLoading: boolean
  hasPermission: boolean | null
}
```

## Usage in Apps

### Method 1: Using the useLocation Hook (Recommended)

```tsx
import { useLocation } from "@/hooks/useLocation"

export default function MyApp({ onClose }: AppProps) {
  // Location is automatically requested when phone loads
  const { position, error, isLoading, hasPermission, requestLocation } = useLocation()

  if (isLoading) return <div>Getting location...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!position) return <button onClick={requestLocation}>Retry Location</button>

  return (
    <div>
      <p>Latitude: {position.coords.latitude}</p>
      <p>Longitude: {position.coords.longitude}</p>
      <p>Accuracy: ±{position.coords.accuracy}m</p>
    </div>
  )
}
```

### Method 2: Using PhoneContext Directly

```tsx
import { usePhone } from "@/contexts/PhoneContext"

export default function MyApp({ onClose }: AppProps) {
  const { location, requestLocation } = usePhone()

  return (
    <div>
      <button onClick={requestLocation}>Get Location</button>
      {location.position && (
        <p>
          {location.position.coords.latitude}, {location.position.coords.longitude}
        </p>
      )}
    </div>
  )
}
```

### Method 3: Using Props (Legacy)

```tsx
export default function MyApp({ onClose, location, locationError, requestLocation }: AppProps) {
  if (locationError) return <div>Error: {locationError.message}</div>
  if (!location) return <button onClick={requestLocation}>Get Location</button>

  return (
    <div>
      <p>Latitude: {location.coords.latitude}</p>
      <p>Longitude: {location.coords.longitude}</p>
    </div>
  )
}
```

## useLocation Hook Options

```typescript
interface UseLocationOptions {
  watch?: boolean // Continuously track position changes
  requestOnMount?: boolean // [DEPRECATED] Not needed - location auto-requested on phone load
}
```

**Note**: The `requestOnMount` option is no longer necessary since location is automatically requested when the phone loads. All apps immediately have access to location data.

### Examples

#### Access Already-Available Location

```tsx
const { position, error, requestLocation } = useLocation()

// Location is already requested - just use it
if (position) {
  // Use position immediately
}
```

#### Manual Retry

```tsx
const { position, error, requestLocation } = useLocation()

// If there was an error, user can retry
if (error) {
  return <button onClick={requestLocation}>Retry Location</button>
}
```

#### Continuous Position Tracking

```tsx
const { position } = useLocation({
  watch: true, // Continuously track position as user moves
})

// Position updates automatically as user moves
// Watch is automatically cleaned up when component unmounts
```

## Location Data Structure

The `GeolocationPosition` object provides:

```typescript
interface GeolocationPosition {
  coords: {
    latitude: number // Decimal degrees
    longitude: number // Decimal degrees
    accuracy: number // Meters
    altitude: number | null // Meters above sea level
    altitudeAccuracy: number | null // Meters
    heading: number | null // Degrees clockwise from north
    speed: number | null // Meters per second
  }
  timestamp: number // Unix timestamp in milliseconds
}
```

## Error Handling

### Error Codes

- **Code 1 (PERMISSION_DENIED)**: User denied location access
- **Code 2 (POSITION_UNAVAILABLE)**: Location information unavailable
- **Code 3 (TIMEOUT)**: Location request timed out

### Error Handling Example

```tsx
const { error, hasPermission, requestLocation } = useLocation()

if (error) {
  if (error.code === 1) {
    return (
      <div>
        <p>Location access denied. Please enable location in your browser.</p>
        <button onClick={requestLocation}>Try Again</button>
      </div>
    )
  }
  return <div>Location error: {error.message}</div>
}
```

## Browser Permissions

### How Permissions Work

1. First time a site requests location, browser shows permission prompt
2. User can Allow or Block
3. Decision is remembered for future visits
4. Users can change permissions in browser settings

### Permission States

- `hasPermission: null` - Permission not yet requested
- `hasPermission: true` - Permission granted
- `hasPermission: false` - Permission denied

### Testing Permissions

**Chrome/Edge:**

1. Click lock icon in address bar
2. Click "Site settings"
3. Find "Location" and set to "Allow" or "Block"

**Firefox:**

1. Click lock icon in address bar
2. Click "Connection secure" → "More information"
3. Go to "Permissions" tab
4. Find "Access Your Location"

**Safari:**

1. Safari → Settings → Websites → Location Services
2. Find your site and set permission

## Implementation Details

### Location Configuration

The emulator uses high-accuracy mode with these settings:

```typescript
{
  enableHighAccuracy: true, // Request GPS if available
  timeout: 10000,          // 10 second timeout
  maximumAge: 0            // Don't use cached position
}
```

### Watch vs. getCurrentPosition

- **getCurrentPosition**: Single location request, returns once
- **watchPosition**: Continuous updates as user moves
- Watch automatically cleans up when component unmounts

### Performance Considerations

1. **Battery**: Watching location continuously uses more battery
2. **Accuracy**: High accuracy mode uses GPS (slower, more power)
3. **Caching**: Set `maximumAge > 0` to allow cached positions
4. **Cleanup**: Always clear watch when not needed

## Example: Maps App

The Maps app demonstrates full location integration:

```tsx
export default function MapsApp({ onClose }: AppProps) {
  const { position, error, isLoading, requestLocation } = useLocation({
    requestOnMount: true,
  })

  const mapUrl = position
    ? `https://www.openstreetmap.org/export/embed.html?...&marker=${position.coords.latitude},${position.coords.longitude}`
    : ""

  return (
    <div>
      {/* Show loading state */}
      {isLoading && <LoadingSpinner />}

      {/* Show error state with helpful message */}
      {error && <ErrorMessage error={error} onRetry={requestLocation} />}

      {/* Show map when position available */}
      {position && <MapView url={mapUrl} position={position} />}
    </div>
  )
}
```

## Security & Privacy

### Browser Security

- Location only works over HTTPS (except localhost)
- User must explicitly grant permission
- Permission can be revoked at any time
- Location access visible in browser UI

### Best Practices

1. **Always handle permission denial gracefully**
2. **Explain why you need location before requesting**
3. **Provide fallback functionality if location unavailable**
4. **Don't request location unnecessarily**
5. **Clear watches when not actively using location**

## Testing

### Local Development

```bash
npm run dev
```

Open `http://localhost:3000` and click the Maps app.

### Testing Different Scenarios

1. **First-time permission**: Clear site data, reload, open Maps
2. **Permission denied**: Block location, verify error handling
3. **No GPS**: Test on desktop (lower accuracy)
4. **Mock location**: Use browser DevTools to simulate location

### Chrome DevTools Location Mocking

1. Open DevTools (F12)
2. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
3. Type "Show Sensors"
4. Select a location or enter custom coordinates
5. Location API will return mocked position

## Common Issues

### "Location not supported"

- **Cause**: Browser doesn't support Geolocation API
- **Solution**: Use modern browser (Chrome, Firefox, Safari, Edge)

### "User denied geolocation"

- **Cause**: User clicked "Block" on permission prompt
- **Solution**: Provide instructions to reset permissions in browser settings

### "Position unavailable"

- **Cause**: GPS/location services disabled on device
- **Solution**: Prompt user to enable location services in system settings

### "Timeout"

- **Cause**: Location request took too long
- **Solution**: Increase timeout or retry request

## Future Enhancements

Possible future additions:

1. **Mock location mode** - Simulate locations for demos
2. **Location history** - Track and visualize movement
3. **Geofencing** - Trigger events when entering/leaving areas
4. **Distance calculations** - Calculate distances between points
5. **Directions** - Basic routing between locations

## Related Files

- `/contexts/PhoneContext.tsx` - Global location state
- `/hooks/useLocation.ts` - Location hook
- `/types/app.ts` - Location interfaces
- `/components/apps/MapsApp.tsx` - Reference implementation
- `/components/phone/Phone.tsx` - Location props passing

---

**Last Updated**: November 2024
**Version**: 1.0
