# Phone Emulator for MarTech Demos

A realistic smartphone emulator built with Next.js, designed for demonstrating martech software (SMS campaigns, push notifications, mobile web experiences) using a desktop browser. No real phone or mobile emulator required!

![Phone Emulator](https://img.shields.io/badge/Next.js-16.0.1-black?logo=next.js) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-blue?logo=tailwindcss) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)

## ✨ Features

### Core Capabilities

- **📱 Realistic Phone UI** - Generic smartphone design (not iOS/Android specific)
- **💬 SMS/Messages App** - Receive SMS via API, display notifications, clickable links
- **🌐 Browser App** - Full web browsing with address bar using native browser rendering
- **🔔 Push Notifications** - Banner notifications that can be clicked to open apps
- **📲 Modular App System** - Extensible framework for adding new apps
- **⏰ System UI** - Status bar with time, battery, signal strength
- **🎨 Home Screen** - Realistic app grid with dummy apps for authentic look
- **📞 Phone Number Login** - Optional phone number registration for remote SMS delivery ✨ NEW
- **⚡ Real-Time Delivery** - Server-Sent Events (SSE) for instant message delivery from external systems ✨ NEW

### Included Apps

**Functional Apps:**

- **Messages** - Display SMS, handle notifications, clickable URLs
- **Browser** - Address bar + iframe-based web viewing

**Dummy Apps (UI only):**

- Camera, Photos, Clock, Calculator, Maps, Music, Contacts, Settings

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the phone emulator.

### Quick Test

Use the built-in SMS Tester (bottom-right corner) to send a test SMS:

1. Enter a sender name (e.g., "Demo Company")
2. Enter a message with a URL (e.g., "Check out our sale: https://example.com")
3. Click "Send SMS"
4. Watch the notification appear on the phone
5. Click the notification to open the Messages app
6. Click the URL to open it in the Browser app

## 📡 SMS API

### Local Delivery (Same Browser)

Send SMS messages to the phone via HTTP API:

```bash
curl -X POST http://localhost:3000/api/sms \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "YourCompany",
    "message": "Special offer! Visit: https://yoursite.com/offer"
  }'
```

### Remote Delivery (Different Browser/Computer) ✨ NEW

Send SMS from marketing automation systems or external applications:

```bash
curl -X POST http://localhost:3000/api/sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+12345678901",
    "sender": "Marketing System",
    "message": "Campaign message here"
  }'
```

```javascript
// JavaScript example for marketing automation
await fetch("https://your-emulator.com/api/sms", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    phoneNumber: "+12345678901", // Target phone number
    sender: "YourBrand",
    message: "Special offer! Visit: https://yoursite.com/offer",
  }),
})
```

**How It Works:**

1. User opens phone emulator and logs in with phone number (e.g., `+12345678901`)
2. External system sends SMS to that phone number via API
3. Message delivered **instantly** via Server-Sent Events (SSE)
4. If phone offline, message queued for delivery when online

📚 **Full Documentation:**

- [docs/API.md](docs/API.md) - Complete API reference
- [docs/REMOTE_SMS.md](docs/REMOTE_SMS.md) - Remote SMS delivery guide ✨ NEW

## 🔧 Adding Custom Apps

The emulator uses a modular app system. Create custom apps in 3 steps:

### 1. Create App Component

```tsx
// components/apps/MyApp.tsx
"use client"

import { AppProps } from "@/types/app"

export default function MyApp({ onClose }: AppProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={onClose} className="text-blue-500">
          ← Back
        </button>
        <h1 className="text-lg font-semibold">My App</h1>
        <div className="w-16" />
      </div>
      <div className="flex-1 overflow-y-auto p-4">{/* Your app content */}</div>
    </div>
  )
}
```

### 2. Register in App Registry

```tsx
// lib/appRegistry.tsx
import MyApp from "@/components/apps/MyApp"

export const appRegistry: App[] = [
  // ... existing apps
  {
    id: "my-app",
    name: "My App",
    icon: <svg>...</svg>,
    iconColor: "bg-purple-500",
    component: MyApp,
    category: "utility",
  },
]
```

That's it! Your app appears on the home screen automatically.

📚 **Full App Development Guide:** [docs/APPS.md](docs/APPS.md)

## 🎯 Use Cases

### Marketing Campaign Demos

Demonstrate SMS campaigns, promotional links, and mobile web experiences without needing a real device.

### Marketing Automation Integration ✨ NEW

Connect real marketing automation platforms (HubSpot, Marketo, Salesforce, etc.) to send SMS to the emulator:

- Login with a fake customer phone number (e.g., `+12345678901`)
- Trigger campaigns in your marketing system targeting that number
- Messages appear instantly on the emulator via SSE
- Perfect for demos, training, and testing

### User Journey Visualization

Show complete user flows: SMS → Notification → App → Web Browser

### Client Presentations

Professional, realistic demonstrations of mobile marketing technology.

### Testing & Development

Test mobile marketing integrations in a controlled desktop environment.

## 🏗️ Project Structure

```
phone-emulator/
├── app/
│   ├── api/
│   │   └── sms/
│   │       ├── route.ts        # Main SMS API (SSE + queue)
│   │       ├── stream/         # SSE endpoint ✨ NEW
│   │       └── poll/           # Polling fallback (deprecated)
│   ├── page.tsx                # Main page with phone number login
│   └── layout.tsx              # Root layout
├── components/
│   ├── apps/                   # Individual app implementations
│   ├── phone/
│   │   ├── Phone.tsx           # Phone shell
│   │   ├── PhoneNumberLogin.tsx # Login screen ✨ NEW
│   │   └── ...                 # Other phone UI components
│   └── SMSTester.tsx           # Built-in testing tool
├── contexts/
│   └── PhoneContext.tsx        # Global phone state
├── hooks/
│   └── useSMSReceiver.ts       # SMS event handling (SSE + BroadcastChannel)
├── lib/
│   └── appRegistry.tsx         # App registration
├── types/
│   └── app.ts                  # TypeScript definitions
└── docs/
    ├── API.md                  # SMS API documentation
    ├── APPS.md                 # App development guide
    └── REMOTE_SMS.md           # Remote SMS feature guide ✨ NEW
```

## 🎨 Customization

### Phone Appearance

Edit `components/phone/Phone.tsx`:

```tsx
// Change phone size (default: iPhone X dimensions)
<div className="w-[375px] h-[812px] ...">

// Change phone color/style
<div className="... border-8 border-gray-900 rounded-[3rem]">
```

### Home Screen Background

Edit `components/phone/HomeScreen.tsx`:

```tsx
// Current: blue-purple gradient
<div className="... bg-linear-to-b from-blue-400 to-purple-500">
```

### Status Bar

Edit `components/phone/StatusBar.tsx` to customize time format, battery display, icons, etc.

## 🛠️ Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript 5
- **State Management:** React Context
- **Fonts:** Geist Sans & Geist Mono

## 📋 Requirements Met

✅ SMS receiving via API with notifications  
✅ Clickable links in SMS messages  
✅ Browser app with address bar  
✅ Modular app interface for extensibility  
✅ Generic smartphone design  
✅ Push notification system  
✅ Dummy apps for realistic appearance  
✅ Status bar with time/battery/signal  
✅ Mouse-based navigation (no keyboard UI)  
✅ API documentation  
✅ App framework documentation  
✅ Remote SMS delivery from external systems ✨ NEW  
✅ Real-time message delivery via SSE ✨ NEW  
✅ Phone number-based targeting ✨ NEW

## 🚦 Navigation

The phone uses click-based navigation optimized for desktop:

- **Open App:** Click app icon on home screen
- **Return Home:** Click the white bar at the bottom of screen (appears when in any app)
- **Back Button:** Click "← Back" in app headers to return to previous screen
- **View Notification:** Notification auto-appears at top, click to open app
- **Dismiss Notification:** Click X on notification
- **Messages:**
  - Conversation list shows grouped messages by sender with unread counts
  - Click any conversation to view the full message thread
  - Click back to return to conversation list

## 🤝 Contributing

This is a demonstration project. To extend it:

1. Add new apps following the pattern in `docs/APPS.md`
2. Create new API endpoints in `app/api/`
3. Extend phone context in `contexts/PhoneContext.tsx`

## 📄 License

This project was created for MarTech demonstration purposes.

## 🆘 Support

- **API Issues:** Check [docs/API.md](docs/API.md)
- **App Development:** See [docs/APPS.md](docs/APPS.md)
- **Browser Console:** Check for errors if things don't work

---

**Made with Next.js, Tailwind CSS, and ❤️ for MarTech demos**
