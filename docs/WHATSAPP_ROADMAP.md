# WhatsApp App - Future Enhancements Roadmap

This document outlines planned features and enhancements for the WhatsApp app in the phone emulator.

## Current Implementation (v1.0)

✅ **Complete Features:**
- Text messaging with timestamps
- Profile pictures with avatar fallback
- Interactive buttons (quick_reply, url, custom)
- Conversation grouping by sender
- Real-time delivery via SSE
- localStorage persistence
- Unread message badges
- WhatsApp branding (green theme, beige background)
- Tester page with templates

---

## Future Enhancements

### 1. Media Support (Images & Videos)

**Description**: Display images and videos within messages via URLs.

**Implementation Details**:

#### Interface Changes
```typescript
export interface WhatsAppMessage {
  id: string
  sender: string
  senderNumber?: string
  profilePictureUrl?: string
  message: string
  mediaUrl?: string        // NEW: URL to media
  mediaType?: "image" | "video" | "document" | "audio"  // NEW: Media type
  mediaThumbnail?: string  // NEW: Thumbnail URL for videos/documents
  timestamp: Date
  read: boolean
  buttons?: WhatsAppButton[]
}
```

#### UI Components
- **Image Messages**:
  - Display as `<img>` with max-width constraint
  - Click to expand/fullscreen view
  - Show loading placeholder
  - Error state with fallback icon
  - Caption support (use `message` field)

- **Video Messages**:
  - Display thumbnail with play icon overlay
  - Click to play inline with controls
  - Loading state and error handling
  - Show duration badge (if provided)

#### API Request Format
```json
{
  "phoneNumber": "+12345678901",
  "sender": "Demo Shop",
  "message": "Check out this photo!",
  "mediaUrl": "https://example.com/photo.jpg",
  "mediaType": "image"
}
```

#### Tester Page Updates
- Add media URL input field
- Media type dropdown (image/video/document/audio)
- Preview section showing how media will appear
- Template buttons with media examples

**Considerations**:
- CORS issues with external images
- Large file size handling
- Thumbnail generation for videos
- Progressive loading for images
- Bandwidth considerations

---

### 2. Document Attachments

**Description**: Support for document files (PDF, DOCX, etc.) with download capability.

**Implementation Details**:

#### UI Design
```
┌─────────────────────────────┐
│  📄 Invoice_Q1_2024.pdf    │
│  245 KB                     │
│  [Download] [Preview]       │
└─────────────────────────────┘
```

#### Features
- File icon based on extension (.pdf, .docx, .xlsx, etc.)
- File name and size display
- Download button (opens URL in new tab)
- Optional preview for PDFs (iframe or new window)

#### Additional Fields
```typescript
mediaFileName?: string    // "Invoice_Q1_2024.pdf"
mediaFileSize?: number    // File size in bytes
```

**Considerations**:
- Security: Validate URLs, prevent malicious files
- Mobile download behavior
- File type icons library
- Preview capability limitations

---

### 3. Voice Notes / Audio Messages

**Description**: Play audio messages inline with waveform visualization.

**Implementation Details**:

#### UI Components
```
┌─────────────────────────────┐
│  ▶️  ▬▬▬▬▬▬▬▬▬▬▬  0:42    │
│  [Waveform visualization]   │
└─────────────────────────────┘
```

#### Features
- Play/pause controls
- Playback progress bar
- Duration display
- Waveform visual (optional, can use simple progress bar initially)
- Speed controls (1x, 1.5x, 2x)

#### Implementation Options
- **Simple**: HTML5 `<audio>` element with custom controls
- **Advanced**: Canvas-based waveform using Web Audio API
- **Library**: Use `wavesurfer.js` or similar

#### API Format
```json
{
  "phoneNumber": "+12345678901",
  "sender": "Customer Support",
  "message": "",
  "mediaUrl": "https://example.com/voicenote.mp3",
  "mediaType": "audio",
  "mediaDuration": 42
}
```

**Considerations**:
- Audio format support (MP3, OGG, WAV)
- Autoplay policies in browsers
- Playback state management (one at a time?)
- Mobile audio playback quirks

---

### 4. Message Status Indicators

**Description**: Show message delivery and read status with check marks.

**Implementation Details**:

#### Status States
- ✓ **Sent** (single gray check)
- ✓✓ **Delivered** (double gray checks)
- ✓✓ **Read** (double blue checks) - WhatsApp blue: #34B7F1

#### Interface Changes
```typescript
export interface WhatsAppMessage {
  // ... existing fields
  status?: "sent" | "delivered" | "read"  // NEW
}
```

#### UI Updates
- Display check marks at bottom-right of message bubble
- Animate transition between states
- Color change when read (gray → blue)

#### API Integration
- Initial status: "sent" (when message created)
- Update to "delivered" when SSE connection receives it
- Update to "read" when user opens conversation

#### Implementation Flow
```
1. Message sent → status: "sent" ✓
2. SSE delivers → status: "delivered" ✓✓
3. User opens conversation → markWhatsAppAsRead() → status: "read" ✓✓ (blue)
```

**Considerations**:
- Privacy settings (some users disable read receipts)
- Group message status (lowest common denominator)
- Retry logic for failed messages
- Status update API endpoints

---

### 5. Typing Indicators

**Description**: Show "typing..." when sender is composing a message.

**Implementation Details**:

#### UI Display
```
┌─────────────────────────────┐
│ Demo Shop                   │
│ typing...                   │
└─────────────────────────────┘
```

#### Features
- Animated ellipsis (... → . .. → .. . → ...)
- Display under sender name in conversation header
- Auto-hide after 3-5 seconds
- Bounce animation for dots

#### API Design
```typescript
// New SSE event type
{
  "type": "typing",
  "sender": "Demo Shop",
  "isTyping": true
}
```

#### State Management
```typescript
// Add to PhoneContext
typingStatus: Map<string, boolean>  // sender → isTyping
setTypingStatus: (sender: string, isTyping: boolean) => void
```

#### Implementation
- Separate SSE event for typing status
- Timeout-based auto-clear (if no message received)
- Debounce typing events (don't send on every keystroke)

**Considerations**:
- Performance with multiple conversations
- Timing synchronization
- Battery impact of frequent updates
- When to show/hide indicator

---

### 6. Last Seen & Online Status

**Description**: Display when sender was last active or if currently online.

**Implementation Details**:

#### UI Display Options
**In Conversation List**:
```
Demo Shop
Last seen today at 2:30 PM
```

**In Conversation Header**:
```
Demo Shop
Online
```
or
```
Demo Shop
Last seen yesterday
```

#### Status Indicators
- 🟢 **Online**: Green dot next to name
- ⚫ **Offline**: No indicator or gray dot
- **Last seen**: Relative time display

#### Interface Changes
```typescript
export interface WhatsAppMessage {
  // ... existing fields
  senderOnlineStatus?: "online" | "offline"
  senderLastSeen?: Date
}
```

or create separate status tracking:
```typescript
interface SenderStatus {
  sender: string
  isOnline: boolean
  lastSeen: Date
}
```

#### API Design
```typescript
// SSE event for status updates
{
  "type": "status",
  "sender": "Demo Shop",
  "isOnline": true,
  "lastSeen": "2024-01-15T14:30:00Z"
}
```

#### Time Display Logic
- **< 1 minute**: "Online"
- **< 1 hour**: "Last seen X minutes ago"
- **< 24 hours**: "Last seen today at HH:MM"
- **< 7 days**: "Last seen Monday at HH:MM"
- **> 7 days**: "Last seen on DD/MM/YYYY"

**Considerations**:
- Privacy settings (users can hide status)
- Real-time updates via SSE
- Timezone handling
- Status persistence across sessions
- Stale status cleanup

---

### 7. Rich Text Formatting

**Description**: Support bold, italic, strikethrough, and monospace text.

**Implementation Details**:

#### WhatsApp Formatting Syntax
- `*bold*` → **bold**
- `_italic_` → *italic*
- `~strikethrough~` → ~~strikethrough~~
- `` `monospace` `` → `monospace`

#### Implementation Approach
**Option 1: Regex Replacement**
```typescript
function formatWhatsAppText(text: string): React.ReactNode {
  // Convert WhatsApp syntax to HTML/React elements
  return text
    .replace(/\*([^\*]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/~([^~]+)~/g, '<del>$1</del>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}
```

**Option 2: Markdown Library**
- Use `react-markdown` or similar
- Custom renderers for WhatsApp-specific syntax

#### UI Updates
- Parse message text before display
- Preserve original text in data
- Handle nested formatting
- Escape HTML to prevent XSS

#### Tester Page
- Add formatting toolbar
- Live preview of formatted text
- Syntax help/examples

**Considerations**:
- Performance with long messages
- Edge cases (unmatched delimiters)
- Security (XSS prevention)
- Copy-paste behavior

---

### 8. Emoji Reactions

**Description**: React to messages with emoji (like, love, laugh, etc.)

**Implementation Details**:

#### UI Design
```
┌─────────────────────────────┐
│ Your order is ready!        │
│ 2:30 PM                     │
├─────────────────────────────┤
│ ❤️ 3  👍 2  😂 1           │
└─────────────────────────────┘
```

#### Interface Changes
```typescript
export interface MessageReaction {
  emoji: string
  count: number
  users?: string[]  // Who reacted
}

export interface WhatsAppMessage {
  // ... existing fields
  reactions?: MessageReaction[]
}
```

#### Features
- Long-press message to show reaction picker
- Common reactions: ❤️ 👍 😂 😮 😢 🙏
- Display count next to each emoji
- Highlight user's own reaction
- Click reaction to add/remove

#### API Design
```typescript
// POST /api/whatsapp/reaction
{
  "messageId": "msg-123",
  "emoji": "❤️",
  "action": "add" | "remove"
}
```

**Considerations**:
- Emoji rendering across platforms
- Reaction limits (max per message?)
- Animation on add/remove
- Group vs 1:1 behavior

---

### 9. Message Forwarding

**Description**: Forward messages to other conversations.

**Implementation Details**:

#### UI Flow
1. Long-press message → Show menu
2. Click "Forward" → Show conversation picker
3. Select conversation(s) → Confirm
4. Message copied to selected conversations

#### Features
- Forward with/without media
- Multi-select conversations
- Forward to multiple recipients at once
- "Forwarded" label on message

#### Interface Changes
```typescript
export interface WhatsAppMessage {
  // ... existing fields
  isForwarded?: boolean
  forwardedFrom?: string  // Original sender
}
```

**Considerations**:
- Privacy implications
- Forward limits (prevent spam)
- Metadata preservation
- UI for forwarded indicator

---

### 10. Search Functionality

**Description**: Search messages across all conversations.

**Implementation Details**:

#### UI Components
- Search bar in header
- Filter by: sender, date range, media type
- Highlight search terms in results
- Navigate to message in conversation

#### Features
- Full-text search
- Search within conversation
- Search across all conversations
- Recent searches
- Search suggestions

#### Implementation
```typescript
function searchMessages(
  messages: WhatsAppMessage[],
  query: string,
  filters?: {
    sender?: string
    dateFrom?: Date
    dateTo?: Date
    hasMedia?: boolean
  }
): WhatsAppMessage[]
```

**Considerations**:
- Performance with large message history
- Indexing strategy (client-side)
- Debounce search input
- Case-insensitive matching
- Special characters handling

---

### 11. Message Deletion

**Description**: Delete individual messages (not just entire conversations).

**Implementation Details**:

#### Delete Options
- **Delete for me**: Remove from own view only
- **Delete for everyone**: Remove for all participants (within time limit)

#### UI Flow
1. Long-press message → Show menu
2. Click "Delete" → Show options
3. Confirm deletion
4. Message removed/replaced with placeholder

#### API Design
```typescript
// POST /api/whatsapp/delete
{
  "messageId": "msg-123",
  "deleteType": "for-me" | "for-everyone"
}
```

#### Placeholder for Deleted Messages
```
┌─────────────────────────────┐
│ 🚫 This message was deleted │
│ 2:30 PM                     │
└─────────────────────────────┘
```

**Considerations**:
- Time limit for "delete for everyone" (e.g., 1 hour)
- Notification when message deleted by sender
- Undo option (short grace period)
- Media cleanup (remove from storage?)

---

### 12. Group Chats

**Description**: Support for group conversations with multiple participants.

**Implementation Details**:

#### Interface Changes
```typescript
export interface WhatsAppMessage {
  // ... existing fields
  conversationType?: "individual" | "group"
  groupId?: string
  groupName?: string
  groupParticipants?: string[]
}
```

#### UI Changes
- Group avatar (multiple pictures or initials)
- Show sender name above each message in group
- Different colors for different senders
- Participant list view
- Admin controls (if applicable)

#### Features
- Group name and icon
- Add/remove participants
- @ mentions
- Reply to specific messages (threading)
- Group info/settings

**Considerations**:
- Scalability with large groups
- Message ordering in groups
- Notification preferences per group
- Storage requirements

---

## Implementation Priority Recommendations

### Phase 1 (High Priority)
1. ✅ **Media Support (Images & Videos)** - Most requested, high visual impact
2. ✅ **Message Status Indicators** - Core WhatsApp feature, expected by users
3. ✅ **Rich Text Formatting** - Easy to implement, adds value

### Phase 2 (Medium Priority)
4. **Document Attachments** - Business use case, extends media support
5. **Voice Notes** - Popular feature, moderate complexity
6. **Last Seen & Online Status** - Enhances realism, social feature

### Phase 3 (Nice to Have)
7. **Typing Indicators** - Polish feature, not critical
8. **Emoji Reactions** - Fun feature, low priority
9. **Search Functionality** - Useful with large message history

### Phase 4 (Complex / Future)
10. **Message Forwarding** - Depends on UI patterns
11. **Message Deletion** - Requires careful UX design
12. **Group Chats** - Major feature, requires significant architecture changes

---

## Technical Considerations

### Performance
- **Large media**: Lazy loading, thumbnails, progressive enhancement
- **Message history**: Pagination, virtual scrolling for long conversations
- **Real-time updates**: Debouncing, batching, efficient SSE handling

### Storage
- **localStorage limits**: ~5-10MB per domain
  - Consider IndexedDB for larger datasets
  - Implement cleanup strategy for old messages
  - Media URLs (don't store actual files)

### Security
- **URL validation**: Prevent XSS via malicious URLs
- **CORS**: Handle cross-origin media loading
- **Content filtering**: Sanitize user input
- **Privacy**: Respect user settings for status, read receipts

### Accessibility
- **Keyboard navigation**: All features keyboard-accessible
- **Screen readers**: Proper ARIA labels for media, status indicators
- **Color contrast**: Ensure text readable on backgrounds
- **Focus management**: Clear focus indicators

### Mobile Responsiveness
- **Touch targets**: Buttons/links minimum 44x44px
- **Gestures**: Swipe actions for common tasks
- **Viewport**: Handle different screen sizes
- **Performance**: Optimize for mobile networks

---

## API Endpoint Summary

### Existing
- `POST /api/whatsapp` - Send message
- `GET /api/whatsapp/stream` - SSE connection
- `POST /api/whatsapp/button` - Button click callback

### Future Endpoints
- `POST /api/whatsapp/media` - Upload media (if hosting)
- `POST /api/whatsapp/reaction` - Add/remove reaction
- `POST /api/whatsapp/delete` - Delete message
- `POST /api/whatsapp/status` - Update online/typing status
- `POST /api/whatsapp/read-receipt` - Mark message as read
- `GET /api/whatsapp/search` - Search messages (server-side)

---

## Testing Checklist Template

For each new feature, test:
- [ ] Basic functionality works
- [ ] Error handling (failed loads, timeouts)
- [ ] localStorage persistence
- [ ] SSE real-time delivery
- [ ] Multiple conversations
- [ ] Long message history
- [ ] Mobile responsiveness
- [ ] Accessibility (keyboard, screen reader)
- [ ] Performance (no lag with many messages)
- [ ] Security (no XSS, CSRF, etc.)

---

## Resources & References

### WhatsApp Design Guidelines
- Official WhatsApp colors: #25D366 (green), #075E54 (dark green), #ECE5DD (beige)
- Icon library: Font Awesome, Material Icons for standard icons
- Emoji: Use native emoji or emoji library like `emoji-mart`

### Useful Libraries
- **Media**: `react-player`, `video.js`, `plyr`
- **Audio waveforms**: `wavesurfer.js`, `peaks.js`
- **Emoji picker**: `emoji-mart`, `emoji-picker-react`
- **Rich text**: `react-markdown`, `marked`
- **Virtual scrolling**: `react-window`, `react-virtualized`
- **Image lightbox**: `react-image-lightbox`, `photoswipe`

### Documentation
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## Notes

This roadmap is a living document. As features are implemented, move them from "Future Enhancements" to a "Changelog" section and update the "Current Implementation" list.

For each feature implementation:
1. Update type definitions in `types/app.ts`
2. Update PhoneContext with new state/methods
3. Update WhatsAppApp component with UI
4. Update API endpoints as needed
5. Update tester page with new fields
6. Add tests and documentation
7. Update CLAUDE.md with new patterns

**Last Updated**: 2025-12-01
**Version**: 1.0 (Text + Buttons + Profile Pictures)
