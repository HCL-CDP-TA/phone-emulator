# App Development Framework

The Phone Emulator uses a modular app system that allows you to easily add new applications to the phone's home screen. This guide explains how to create and register new apps.

## App Interface

All apps must conform to the `App` interface defined in `types/app.ts`:

```typescript
interface App {
  id: string // Unique identifier
  name: string // Display name on home screen
  icon: ReactNode // Icon component (SVG recommended)
  iconColor: string // Tailwind background color class
  component: React.ComponentType<AppProps> // The app component
  category: "system" | "communication" | "media" | "utility" | "productivity"
  canSendNotifications?: boolean // Whether app can send notifications
}

interface AppProps {
  onClose: () => void // Callback to close the app
  onSendNotification?: (notification: Notification) => void // Send notifications
}
```

## Creating a New App

### Step 1: Create the App Component

Create a new file in `components/apps/YourApp.tsx`:

```tsx
"use client"

import { AppProps } from "@/types/app"

export default function YourApp({ onClose, onSendNotification }: AppProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with back button */}
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={onClose} className="text-blue-500 font-medium">
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Your App</h1>
        <div className="w-16" />
      </div>

      {/* App content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Your app UI goes here */}
        <p>Hello from your app!</p>
      </div>
    </div>
  )
}
```

### Step 2: Register the App

Add your app to the `appRegistry` in `lib/appRegistry.tsx`:

```tsx
import YourApp from "@/components/apps/YourApp"

export const appRegistry: App[] = [
  // ... existing apps ...
  {
    id: "your-app",
    name: "Your App",
    icon: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        {/* Your SVG path */}
      </svg>
    ),
    iconColor: "bg-purple-500",
    component: YourApp,
    category: "utility",
    canSendNotifications: true,
  },
]
```

That's it! Your app will now appear on the home screen.

## App Capabilities

### Accessing Phone Context

Use the `usePhone` hook to interact with the phone system:

```tsx
import { usePhone } from '@/contexts/PhoneContext';

function YourApp({ onClose }: AppProps) {
  const { openApp, addNotification, smsMessages } = usePhone();

  // Open another app
  const handleOpenBrowser = () => {
    openApp('browser');
  };

  // Send a notification
  const handleNotify = () => {
    addNotification({
      appId: 'your-app',
      appName: 'Your App',
      title: 'Hello!',
      message: 'This is a notification from your app',
      onClick: () => openApp('your-app'),
    });
  };

  return (
    // ... your UI
  );
}
```

### Available Context Methods

```typescript
interface PhoneContextType {
  activeApp: string | null // Currently open app ID
  openApp: (appId: string) => void // Open an app
  closeApp: () => void // Return to home screen
  notifications: Notification[] // All notifications
  addNotification: (notification) => void // Create notification
  dismissNotification: (id: string) => void // Remove notification
  smsMessages: SMS[] // All SMS messages
  addSMS: (sms) => void // Add new SMS (usually from API)
  markSMSAsRead: (id: string) => void // Mark SMS as read
}
```

## App Categories

Choose the appropriate category for your app:

- **system** - Core system apps (Settings, etc.)
- **communication** - Messaging, phone, contacts
- **media** - Photos, music, video, camera
- **utility** - Browser, clock, calculator, maps
- **productivity** - Notes, calendar, email

## Design Guidelines

### Layout Structure

Apps should follow this standard structure:

```tsx
<div className="flex flex-col h-full bg-white">
  {/* Fixed header */}
  <div className="flex items-center justify-between p-4 border-b">
    <button onClick={onClose}>← Back</button>
    <h1>App Name</h1>
    <div className="w-16" />
  </div>

  {/* Scrollable content */}
  <div className="flex-1 overflow-y-auto">{/* Content here */}</div>
</div>
```

### Colors

Use Tailwind color classes. Common patterns:

- **Header backgrounds**: `bg-gray-100`, `bg-white`
- **Dark mode apps**: `bg-black`, `bg-gray-900`
- **Accent buttons**: `text-blue-500`, `bg-blue-500`
- **Icon colors**: Use the `iconColor` prop for consistent branding

### Icons

Use SVG icons with Material Design or similar icon sets:

```tsx
icon: <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
  <path d="..." />
</svg>
```

## Example: Creating a Notes App

Here's a complete example of a functional notes app:

```tsx
"use client"

import { AppProps } from "@/types/app"
import { useState } from "react"

export default function NotesApp({ onClose }: AppProps) {
  const [notes, setNotes] = useState<string[]>([])
  const [currentNote, setCurrentNote] = useState("")

  const handleAddNote = () => {
    if (currentNote.trim()) {
      setNotes([currentNote, ...notes])
      setCurrentNote("")
    }
  }

  return (
    <div className="flex flex-col h-full bg-yellow-50">
      <div className="flex items-center justify-between p-4 border-b bg-yellow-100">
        <button onClick={onClose} className="text-blue-500 font-medium">
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Notes</h1>
        <button onClick={handleAddNote} className="text-blue-500 font-medium">
          Add
        </button>
      </div>

      <div className="p-4">
        <textarea
          value={currentNote}
          onChange={e => setCurrentNote(e.target.value)}
          className="w-full p-3 border border-yellow-300 rounded-lg"
          rows={4}
          placeholder="Write a note..."
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {notes.map((note, index) => (
          <div key={index} className="p-3 bg-yellow-100 rounded-lg">
            {note}
          </div>
        ))}
      </div>
    </div>
  )
}
```

Then register it:

```tsx
{
  id: 'notes',
  name: 'Notes',
  icon: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
    </svg>
  ),
  iconColor: 'bg-yellow-500',
  component: NotesApp,
  category: 'productivity',
  canSendNotifications: false,
}
```

## Best Practices

1. **Always include a back button** - Users need a way to return to the home screen
2. **Use proper overflow handling** - Wrap scrollable content in `overflow-y-auto`
3. **Follow mobile UI patterns** - Large touch targets, clear typography
4. **Handle empty states** - Show friendly messages when there's no content
5. **Test on different screen sizes** - The phone is 375x812px (iPhone X dimensions)
6. **Use semantic HTML** - Proper buttons, forms, and ARIA labels
7. **Consider dark mode** - For media/entertainment apps especially

## Advanced Features

### Inter-App Communication

Apps can open other apps and pass data via localStorage:

```tsx
// In App A - Save data and open App B
localStorage.setItem("sharedData", JSON.stringify({ url: "https://example.com" }))
openApp("browser")

// In App B - Read the data
useEffect(() => {
  const data = localStorage.getItem("sharedData")
  if (data) {
    const parsed = JSON.parse(data)
    // Use the data
    localStorage.removeItem("sharedData")
  }
}, [])
```

### Notifications

Apps with `canSendNotifications: true` can send notifications:

```tsx
onSendNotification?.({
  appId: "your-app",
  appName: "Your App",
  title: "Important Update",
  message: "Something happened in your app!",
  onClick: () => {
    // Handle notification tap
    openApp("your-app")
  },
})
```

## Need Help?

Check the existing app implementations in `components/apps/` for reference:

- **MessagesApp.tsx** - Complex app with message display and link handling
- **BrowserApp.tsx** - Input handling and iframe integration
- **ClockApp.tsx** - Real-time updates with useEffect
- **SettingsApp.tsx** - List-based UI pattern
