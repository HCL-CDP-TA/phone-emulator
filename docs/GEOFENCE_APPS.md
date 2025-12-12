# Geofence Apps Integration Guide

This guide explains how to integrate your web application with the phone emulator's geofence system.

## Overview

Geofence apps are web applications loaded in iframes that can register geofence events (enter/exit) with the phone emulator. The emulator handles location tracking and notifications while your app receives geofence events from the backend.

## Setup

### 1. Configure Your App

Add your app to [`components/apps/geofenceAppsConfig.ts`](../components/apps/geofenceAppsConfig.ts):

```typescript
{
  id: "your-app",
  name: "Your App Name",
  url: "https://your-app.example.com/",
  iconName: "YourIcon",
  iconColor: "bg-blue-700",
  userIdMode: "postmessage",  // Enable postMessage userId
  notifications: {
    enter: {
      enabled: true,  // Show notification on geofence entry
    },
    exit: {
      enabled: true,  // Show notification on geofence exit
    },
  },
  geotrackingEnabled: true,  // Enable automatic tracking
  visible: true,  // Show on home screen
}
```

### 2. Create an Icon

Add your icon to [`components/apps/geofenceIconPresets.tsx`](../components/apps/geofenceIconPresets.tsx) or [`components/apps/industryIcons.tsx`](../components/apps/industryIcons.tsx).

## Integration Code

### Detect If Running in Iframe

Your app should detect if it's running inside the phone emulator:

```javascript
function isInIframe() {
  try {
    return window.self !== window.top
  } catch (e) {
    // If accessing window.top throws an error due to cross-origin,
    // we're definitely in an iframe
    return true
  }
}

// Use it
if (isInIframe()) {
  console.log("Running in phone emulator")
  // Initialize phone emulator integration
} else {
  console.log("Running standalone")
  // Normal web app behavior
}
```

### Send User ID to Phone Emulator

When your app determines the user's identity (login, session, etc.), send it to the phone emulator:

```javascript
function sendUserIdToPhoneEmulator(userId) {
  // Only send if in iframe
  if (!isInIframe()) {
    return
  }

  // Send postMessage to parent window
  window.parent.postMessage({
    type: "set-user-id",
    userId: userId
  }, "*")
  
  console.log("User ID sent to phone emulator:", userId)
}
```

**Important**: The message must have:
- `type: "set-user-id"` (exact string, required)
- `userId: string` (any string identifier for your user)

### Full Example Integration

```javascript
// Check if running in phone emulator
const isInPhoneEmulator = isInIframe()

// When user logs in or user ID is available
function onUserAuthenticated(userId) {
  if (isInPhoneEmulator) {
    // Send user ID to phone emulator for geofence tracking
    window.parent.postMessage({
      type: "set-user-id",
      userId: userId
    }, "*")
  }
  
  // Continue with your app logic
  initializeApp(userId)
}

// Example: Send user ID on page load if user is already logged in
window.addEventListener("DOMContentLoaded", () => {
  const currentUserId = getCurrentUser() // Your function to get user ID
  
  if (currentUserId && isInPhoneEmulator) {
    window.parent.postMessage({
      type: "set-user-id",
      userId: currentUserId
    }, "*")
  }
})
```

### TypeScript Example

```typescript
interface PhoneEmulatorMessage {
  type: "set-user-id"
  userId: string
}

function isInIframe(): boolean {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
}

function sendUserIdToPhoneEmulator(userId: string): void {
  if (!isInIframe()) {
    return
  }

  const message: PhoneEmulatorMessage = {
    type: "set-user-id",
    userId: userId
  }

  window.parent.postMessage(message, "*")
}

// Usage
const user = await authenticateUser()
sendUserIdToPhoneEmulator(user.id)
```

## How It Works

### User ID Flow

1. **Your App**: User logs in or app initializes with user identity
2. **Your App**: Sends postMessage with `type: "set-user-id"` and `userId`
3. **Phone Emulator**: Receives message via postMessage listener
4. **Phone Emulator**: Saves userId to localStorage (persists across sessions)
5. **Phone Emulator**: Initializes GeofenceMonitor SDK with this userId
6. **Phone Emulator**: Starts tracking location and geofence events
7. **Backend**: Links geofence events to this userId

### Geofence Event Flow

1. **Phone Emulator**: Tracks device location (real GPS or simulated)
2. **Phone Emulator**: Sends location to GeofenceMonitor SDK
3. **SDK**: Evaluates geofence rules on server
4. **Backend**: Sends geofence enter/exit events for this userId
5. **Phone Emulator**: Displays notifications (if enabled in config)
6. **Your App**: Can also receive geofence events from backend independently

## Configuration Options

### userIdMode

Two modes are available:

- **`"postmessage"`**: Your app sends userId via postMessage (recommended for custom apps)
- **`"manual"`**: User manually enters userId in a modal (for testing or generic apps)

### Notifications

Control when notifications appear:

```typescript
notifications: {
  enter: {
    enabled: true,  // Show notification when entering a geofence
  },
  exit: {
    enabled: true,  // Show notification when exiting a geofence
  },
}
```

### geotrackingEnabled

When `true`, the phone emulator automatically starts location tracking when the app opens. When `false`, tracking must be manually enabled in settings.

## Testing

### Test with Location Overrides

1. Open the phone emulator
2. Click the **Map** button (top-left) to show location map
3. Click the **Location** button (pin icon) to select a test route
4. Your app will receive location updates as the route plays

### Test User ID Integration

1. Add a button to your app: "Send User ID to Phone"
2. Click button to send postMessage
3. Check browser console for confirmation
4. Open phone emulator Settings app to verify userId is saved

### Debug Logging

Enable debug mode in your app:

```javascript
const DEBUG = isInIframe()

function sendUserIdToPhoneEmulator(userId) {
  if (!isInIframe()) {
    if (DEBUG) console.log("Not in iframe, skipping user ID send")
    return
  }

  const message = {
    type: "set-user-id",
    userId: userId
  }

  if (DEBUG) {
    console.log("Sending user ID to phone emulator:", message)
  }

  window.parent.postMessage(message, "*")
}
```

## Security Considerations

### Cross-Origin Communication

The postMessage API is used for cross-origin communication between your app and the phone emulator. 

**Current implementation uses `"*"` as the target origin** for simplicity in demo environments. For production:

```javascript
// Production: Specify exact origin
const PHONE_EMULATOR_ORIGIN = "https://phone.example.com"
window.parent.postMessage(message, PHONE_EMULATOR_ORIGIN)
```

### User ID Privacy

- User IDs are stored in localStorage (client-side only)
- No sensitive data should be used as userId
- Use opaque identifiers (e.g., UUID) rather than emails or phone numbers
- User IDs are sent to the geofence backend API

## Common Issues

### "User ID not being set"

**Symptoms**: Geofence tracking doesn't start, no notifications

**Causes**:
- Wrong message format (check `type` is exactly `"set-user-id"`)
- Not running in iframe
- postMessage sent before iframe loads
- userId is empty or not a string

**Solution**:
```javascript
// Add validation
function sendUserIdToPhoneEmulator(userId) {
  if (!userId || typeof userId !== "string") {
    console.error("Invalid userId:", userId)
    return
  }
  
  if (!isInIframe()) {
    console.warn("Not in iframe")
    return
  }
  
  window.parent.postMessage({
    type: "set-user-id",
    userId: userId.trim()
  }, "*")
}
```

### "iframe not detected"

**Symptoms**: `isInIframe()` returns false when it should be true

**Cause**: Browser security restrictions or incorrect implementation

**Solution**: Use the try-catch pattern shown above to handle cross-origin errors

### "Geofence events not firing"

**Checklist**:
1. ✓ User ID sent successfully
2. ✓ `geotrackingEnabled: true` in config
3. ✓ Location permission granted
4. ✓ Geofences configured in backend
5. ✓ Location is within geofence radius
6. ✓ Backend API URL configured correctly

## API Reference

### postMessage Format

```typescript
interface SetUserIdMessage {
  type: "set-user-id"  // Required: exact string
  userId: string       // Required: user identifier
}

// Send to parent
window.parent.postMessage(message, "*")
```

### Environment Variables

Configure backend connection:

```bash
# Geofence API endpoint
NEXT_PUBLIC_GEOFENCE_API_URL=http://localhost:3001

# Optional: API key for authenticated endpoints
NEXT_PUBLIC_GEOFENCE_API_KEY=your-api-key
```

## Example Apps

See existing implementations:

- **UniBank**: [`geofenceAppsConfig.ts` line 24](../components/apps/geofenceAppsConfig.ts#L24) - Banking app with postMessage userId
- **UniTel**: [`geofenceAppsConfig.ts` line 41](../components/apps/geofenceAppsConfig.ts#L41) - Telco app with postMessage userId
- **Costco**: [`geofenceAppsConfig.ts` line 58](../components/apps/geofenceAppsConfig.ts#L58) - Retail app with manual userId

## Related Documentation

- [Location Services](LOCATION.md) - Location tracking and GPS
- [Apps Development](APPS.md) - Creating new apps
- [API Reference](API.md) - All API endpoints

## Support

For issues or questions:
1. Check browser console for errors
2. Verify postMessage format matches exactly
3. Test `isInIframe()` function
4. Confirm userId is being saved in localStorage (DevTools → Application → Local Storage)
