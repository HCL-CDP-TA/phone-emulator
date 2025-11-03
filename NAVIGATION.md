# Navigation Guide

## How to Navigate the Phone Emulator

### 🏠 Returning to Home Screen

When you're in any app, you'll see a **white horizontal bar** at the bottom of the phone screen. This is the home button.

```
┌─────────────────────────┐
│  [App content here]     │
│                         │
│                         │
│         ═══════         │ ← Click this white bar
└─────────────────────────┘
```

**Click the white bar** to instantly return to the home screen.

### 📱 Opening Apps

On the home screen, simply **click any app icon** to open that app.

### ⬅️ Back Navigation

Most apps have a **"← Back" button** in the top-left corner of their header. This takes you back to the previous screen or view within that app.

For example, in Messages:

- First screen: Conversation list
- Click a conversation → Opens that thread
- Click "← Back" → Returns to conversation list
- Click home bar → Returns to home screen

### 💬 Messages App - Conversations

The Messages app now groups messages by sender into conversations:

#### Conversation List View

```
┌─────────────────────────────┐
│ ← Back  Messages         │
├─────────────────────────────┤
│ Demo Company          🔵2   │  ← Unread count
│ Check out our sale...       │
│                      10:30  │
├─────────────────────────────┤
│ Marketing Team              │
│ Your code is: 123456        │
│                      10:15  │
└─────────────────────────────┘
```

- **Blue badge**: Number of unread messages from that sender
- **Click any row**: Opens the full conversation with that sender

#### Conversation Thread View

```
┌─────────────────────────────┐
│ ← Back  Demo Company     │
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │ Hi! Special offer:  │    │
│  │ https://example.com │    │ ← Click links
│  │                10:25│    │
│  └─────────────────────┘    │
│                              │
│  ┌─────────────────────┐    │
│  │ Don't miss out!     │    │
│  │                10:30│    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

- **Messages**: Displayed in chronological order (oldest to newest)
- **Links**: Automatically detected and clickable
- **Click a link**: Opens the Browser app with that URL
- **Click "← Back"**: Returns to conversation list

### 🔔 Notifications

When an SMS arrives:

1. **Notification appears** at the top of the phone screen
2. **Click the notification** → Opens Messages app and shows that conversation
3. **Click the X** → Dismisses the notification without opening Messages

### 🌐 Browser App

The browser app lets you visit any website:

1. **Address bar** at the top
2. **Type a URL** (e.g., "example.com")
3. **Click "Go"** to load the page
4. **Click home bar** to return home
5. **Refresh button** in the header to reload the page

### 📋 Quick Reference

| Action                   | How To                              |
| ------------------------ | ----------------------------------- |
| Go home                  | Click white bar at bottom           |
| Open app                 | Click app icon                      |
| Go back                  | Click "← Back" button               |
| View conversation        | Click conversation in Messages list |
| Open link                | Click blue underlined link          |
| Dismiss notification     | Click X on notification             |
| Return from notification | Notification auto-opens Messages    |

### 💡 Tips

- **The home bar only appears when you're in an app** - it's not visible on the home screen itself
- **Multiple messages from same sender** automatically group into one conversation
- **Unread badges** on conversations show how many new messages you have
- **Links in messages** are automatically detected and made clickable
- **No keyboard needed** - just use your mouse to click and your regular keyboard to type in the browser address bar

### 🎯 Complete User Flow Example

Here's a typical martech demo flow:

1. **Start**: User on home screen
2. **SMS arrives**: Notification slides down from top
   - "Marketing Team: Check out our sale! https://shop.com"
3. **Click notification**: Opens Messages app
4. **View conversation list**: Sees "Marketing Team (1)" with unread badge
5. **Click conversation**: Opens full thread with that sender
6. **Click the link**: Browser app opens loading https://shop.com
7. **Browse website**: User can navigate the site
8. **Click home bar**: Returns to home screen
9. **Done**: Complete mobile marketing journey demonstrated!

---

**Need help?** Check the README.md or docs/ folder for more details.
