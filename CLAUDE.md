# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js-based phone emulator for demonstrating martech (marketing technology) software. The emulator displays a realistic smartphone interface in a desktop browser, capable of receiving SMS, HTML emails, and push notifications via API, displaying notifications, running modular apps including a functional web browser, and simulating USSD interactive sessions with a configurable menu tree and HCL CDP event integration.

**Key Design Principle**: The emulator uses a modular architecture where new apps can be added without modifying core infrastructure - just create a component and register it.

## Development Commands

```bash
# Development server (Next.js with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Prisma commands
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (GUI)
```

The development server runs on `http://localhost:3000` by default.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL 14+ with Prisma ORM 5
- **State**: React Context API
- **Real-time**: Server-Sent Events (SSE)
- **Cross-tab**: BroadcastChannel API
- **Storage**: localStorage for message persistence, PostgreSQL for location presets
- **Social Integration**: Iframe webviews with PostMessage API
- **Maps**: Leaflet.js with React-Leaflet for interactive maps
- **Location**: Browser Geolocation API with override system
- **USSD**: Custom tree-walking engine with file-backed config (`ussd-config.json`)
- **CDP Events**: `@hcl-cdp-ta/cdp-node-sdk` (server-side, optional)

## Commit Message Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated releases:

```
<type>(<scope>): <subject>
```

**Types**: `feat`, `fix`, `perf`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore`

**Scopes**: `messages`, `email`, `browser`, `phone`, `sms`, `social`, `api`, `ui`, `context`, `hooks`, `location`, `maps`, `ussd`, `dialer`

**Examples**:

- `feat(messages): add avatar colors to conversations`
- `fix(phone): correct status bar padding issue`
- `feat(social): add TikTok integration`
- `feat(location): add route playback with smooth interpolation`
- `docs: update API documentation`

Breaking changes: Add `!` after type or `BREAKING CHANGE:` in footer.

## Path Aliases

The project uses `@/` as an alias for the root directory (configured in `tsconfig.json`):

```typescript
import { usePhone } from "@/contexts/PhoneContext"
import { AppProps } from "@/types/app"
import MessagesApp from "@/components/apps/MessagesApp"
```

## Detailed Documentation

@docs/claude/architecture.md
@docs/claude/api.md
@docs/claude/development.md
@docs/claude/deployment.md
@docs/claude/design-decisions.md
