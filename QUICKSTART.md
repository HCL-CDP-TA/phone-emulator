# Phone Emulator - Quick Start Guide

## What You've Built

A fully functional smartphone emulator that runs in a desktop browser, designed for demonstrating martech (marketing technology) software without needing a real phone.

## Key Features Completed

### ✅ Core Functionality

1. **SMS System** - Receive SMS messages via API with full notification support
2. **Browser App** - Browse real websites with address bar
3. **Messages App** - View SMS history, click links to open browser
4. **Notification System** - Pop-up notifications that open apps when clicked
5. **Modular App Framework** - Easy to add new apps

### ✅ UI Components

- Realistic phone shell (iPhone X dimensions)
- Status bar with live time, battery, signal
- Home screen with app grid
- 10 apps total (2 functional, 8 dummy for realism)

### ✅ Documentation

- API documentation (`docs/API.md`)
- App development guide (`docs/APPS.md`)
- Complete README with examples

## How to Use

### Start the Server

```bash
npm run dev
```

Visit http://localhost:3000

### Send an SMS

**Option 1: Using the Built-in Tester**

- Look for the white box in the bottom-right corner
- Enter a sender name and message (include a URL!)
- Click "Send SMS"

**Option 2: Using the API**

```bash
curl -X POST http://localhost:3000/api/sms \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "Test Company",
    "message": "Check this out: https://example.com"
  }'
```

**Option 3: From JavaScript**

```javascript
await fetch("/api/sms", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sender: "Marketing Team",
    message: "Special offer! https://yoursite.com/promo",
  }),
})
```

### The User Flow

1. **SMS arrives** → Notification appears at top of phone
2. **Click notification** → Opens Messages app showing conversation list
3. **Click conversation** → Opens that conversation thread
4. **Click link in message** → Opens Browser app with that URL
5. **Swipe up from bottom** → Home button appears, click to return home
6. **Click "← Back"** in app header → Returns to previous screen

## Project Structure

```
phone-emulator/
├── app/
│   ├── api/sms/route.ts      ← API endpoint
│   ├── page.tsx              ← Main page
│   ├── layout.tsx            ← Root layout
│   └── globals.css           ← Styles
├── components/
│   ├── apps/                 ← All app implementations
│   │   ├── MessagesApp.tsx   ← SMS viewer (functional)
│   │   ├── BrowserApp.tsx    ← Web browser (functional)
│   │   └── [8 other apps]    ← Dummy apps
│   ├── phone/
│   │   ├── Phone.tsx         ← Main phone shell
│   │   ├── StatusBar.tsx     ← Top status bar
│   │   ├── HomeScreen.tsx    ← App grid
│   │   └── NotificationBanner.tsx  ← Notifications
│   └── SMSTester.tsx         ← Testing tool
├── contexts/
│   └── PhoneContext.tsx      ← Global state
├── hooks/
│   └── useSMSReceiver.ts     ← SMS event handling
├── lib/
│   └── appRegistry.tsx       ← App registration
├── types/
│   └── app.ts               ← TypeScript types
└── docs/
    ├── API.md               ← API documentation
    └── APPS.md              ← App dev guide
```

## Adding a New App

1. **Create the component** in `components/apps/YourApp.tsx`
2. **Register it** in `lib/appRegistry.tsx`
3. **That's it!** It appears on the home screen automatically

See `docs/APPS.md` for detailed instructions and examples.

## Customization Ideas

### Change Phone Size

Edit `components/phone/Phone.tsx`:

```tsx
<div className="w-[375px] h-[812px] ...">
```

### Change Home Screen Colors

Edit `components/phone/HomeScreen.tsx`:

```tsx
<div className="... bg-linear-to-b from-blue-400 to-purple-500">
```

### Add More Apps

Follow the pattern in `docs/APPS.md` - it's very simple!

## Technology Used

- **Next.js 16** - React framework with App Router
- **Tailwind CSS 4** - Utility-first CSS
- **TypeScript 5** - Type safety
- **React Context** - State management

## Demo Scenario

Here's a complete marketing demo flow:

1. **Setup**: Have the phone emulator open on screen
2. **Action**: Send SMS via API (or tester)
   ```
   Sender: "SuperShop"
   Message: "🎉 Flash sale! 50% off today: https://example.com/sale"
   ```
3. **Result**: Notification slides down from top
4. **Click notification**: Opens Messages app showing the SMS
5. **Click the link**: Opens Browser app loading the website
6. **Done**: Complete mobile marketing journey demonstrated!

## Troubleshooting

### Notification doesn't appear

- Check browser console for errors
- Make sure the phone emulator is visible on screen
- Wait 1-2 seconds - there might be a slight delay

### Link doesn't work in browser

- Some sites block iframe embedding
- Try a different URL
- The browser is using native rendering, so any site that works in your browser should work

### App doesn't open

- Check that you registered it in `lib/appRegistry.tsx`
- Make sure you imported the component correctly
- Look for TypeScript errors in your IDE

## Next Steps

1. **Customize** the look and feel to match your brand
2. **Add apps** specific to your demo needs
3. **Integrate** with your martech platform's API
4. **Present** to clients with confidence!

## All Requirements Met ✅

- ✅ Receive SMS via API
- ✅ Show SMS notification
- ✅ Messages app with clickable links
- ✅ Browser app with address bar
- ✅ Modular app system
- ✅ Generic phone design
- ✅ Push notifications
- ✅ Dummy apps for realism
- ✅ Status bar (time, battery, signal)
- ✅ Mouse-based navigation
- ✅ API documentation
- ✅ App framework documentation

---

**You're all set! Start the dev server and try sending an SMS. 🚀**
