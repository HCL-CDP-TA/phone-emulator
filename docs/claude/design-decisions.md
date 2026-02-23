# Design Decisions, Limitations & Conventions

## Important Design Decisions

1. **No Top Padding in Apps**: Apps render full height. Phone component adds `pt-11` to wrapper for StatusBar clearance.

2. **Home Button Visibility**: Only appears when app is active (not on home screen).

3. **Conversation-Based Messages**: Messages grouped by sender. Only full conversations can be deleted, not individual messages.

4. **Session ID System**: Each tab gets unique session ID in sessionStorage for local SMS targeting and multi-instance support.

5. **Phone Number Login**: Optional login enables remote SMS delivery. "Skip" button preserves original local-only behavior.

6. **SSE Real-Time Delivery**: Server maintains Map of active SSE connections per phone number. Messages broadcast instantly. Keep-alive heartbeat every 5 seconds detects dead connections. Auto-cleanup on close.

7. **Location Auto-Request**: Location requested automatically on PhoneProvider mount. Available to all apps immediately via props or hooks.

8. **Custom Mobile Cursor**: CSS cursor styling in `/app/globals.css` creates touch-point appearance for desktop browsers.

9. **USSD Config Persistence**: `ussd-config.json` in the project root is the single source of truth. The server reads it at startup via a module-level singleton in `/app/api/ussd/config/route.ts`. Writes are synchronous (`writeFileSync`) so the file is always consistent. Deleting the file reverts to the built-in defaults in `lib/ussdDefaults.ts`.

10. **USSD goto Pattern**: Instead of duplicating an entire sub-tree for "Main Menu" navigation, any node can set `goto: "*100#"` (or any root code). The session route resolves this by looking up the root node in the config and setting it as the current node, keeping the session alive.

11. **USSD serverExternalPackages**: `next.config.ts` declares `@hcl-cdp-ta/cdp-node-sdk` in `serverExternalPackages` to prevent Next.js from bundling the Node.js-only SDK through the webpack pipeline.

## Known Limitations

1. **Browser App**: Cannot navigate back within iframe (browser security limitation)
2. **SMS Delivery**: Local mode requires same origin (domain/port)
3. **Limited Server State**: PostgreSQL database for location presets only; SMS/email messages and SSE connections are in-memory only
4. **Single Device Per Tab**: Each browser tab emulates one phone
5. **Link Detection**: Simple regex for URL parsing
6. **Social Apps**: Require external backend, iframe sandbox restrictions apply, postMessage only works from same-origin or with proper CORS
7. **USSD Sessions**: In-memory only (consistent with SSE connections). Sessions are lost on server restart. 5-minute timeout.
8. **USSD Config**: Single shared config file (`ussd-config.json`). No per-user or per-session config isolation.

## Styling Conventions

- Tailwind CSS 4 utility classes
- Phone dimensions: 430x875px (iPhone-like proportions)
- Consistent padding: `p-4` for cards, `p-3` for tight areas
- Rounded: `rounded-lg` for cards, `rounded-full` for buttons/avatars
- Shadows: `shadow-lg` for elevation
- Colors: StatusBar icons white, Messages app green, Browser app multi-color Chrome logo
- Custom cursor applied via `globals.css`

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

# Geofence API configuration (for location-config screen)
NEXT_PUBLIC_GEOFENCE_API_URL=http://localhost:3001
NEXT_PUBLIC_GEOFENCE_API_KEY=your-api-key  # Optional, only needed for authenticated endpoints
```
