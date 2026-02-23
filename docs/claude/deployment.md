# Database Setup & Deployment

## Database Setup

The application uses **PostgreSQL** with **Prisma ORM** for storing location presets centrally. This allows all users to share the same location configurations.

### Initial Setup

1. **Configure database connection** in `.env.local`:
```bash
DATABASE_URL=postgresql://multitenant_user:multitenant_password@localhost:5432/phone_emulator?schema=public
```

2. **Run migrations** to create database schema:
```bash
npm run prisma:migrate
```

3. **Generate Prisma Client**:
```bash
npm run prisma:generate
```

### Database Schema

**LocationPreset Model** (`location_presets` table):
- `id` (UUID, primary key)
- `name` (String) - Preset display name
- `description` (String, optional) - Preset description
- `type` (Enum: STATIC | ROUTE) - Location type
- `latitude` (Float, optional) - For static locations
- `longitude` (Float, optional) - For static locations
- `waypoints` (JSON, optional) - Array of waypoints for routes
- `createdAt` (DateTime) - Auto-generated
- `updatedAt` (DateTime) - Auto-updated

**No Default Presets**: The application starts with an empty database. Users create location presets via the Location Config screen.

## Production Deployment

The project includes an automated deployment script (`deploy.sh`) that follows the same pattern as social-media-simulator-app:

### Deployment Script Usage

```bash
# Deploy a tagged version
./deploy.sh v1.0.0 production

# Deploy from a specific branch
./deploy.sh feature/my-feature development --branch

# Deploy from local directory (for testing)
./deploy.sh local development --local
```

### What the Script Does

1. Stops and removes existing containers/images
2. Handles GitHub SSH authentication (or uses local directory)
3. Clones repository and checks out specified version/branch/tag
4. Builds Docker image with all build args
5. Loads environment variables from `.env` file in deploy directory
6. Configures database connection (Docker network or host.docker.internal)
7. Runs container with all required environment variables
8. Waits for health check and reports success/failure

### docker-entrypoint.sh Automatic Handling

- Waits for PostgreSQL to be ready (pg_isready checks)
- Creates database if it doesn't exist
- Runs `prisma migrate deploy` automatically
- Handles migration drift (resets schema if migrations are in bad state)
- Idempotent - safe to run multiple times

### Environment Variables

Create a `.env` file in the project root:

```bash
# Database (required)
DATABASE_URL=postgresql://user:password@host:5432/phone_emulator?schema=public

# Social media app (optional)
SOCIAL_APP_KEY=your-key
NEXT_PUBLIC_SOCIAL_APP_KEY=your-key
NEXT_PUBLIC_SOCIAL_APP_BASE_URL=https://social.demo.now.hclsoftware.cloud

# Geofence API (optional)
NEXT_PUBLIC_GEOFENCE_API_URL=https://geofence-api-url
NEXT_PUBLIC_GEOFENCE_API_KEY=your-key

# HCL CDP integration for USSD events (optional)
CDP_API_KEY=your-cdp-api-key
CDP_PASS_KEY=your-cdp-pass-key

# GitHub SSH key (optional, for remote deployments)
GITHUB_SSH_KEY_PATH=/path/to/ssh/key
```

### Database Connection Modes

- **Local PostgreSQL**: If DATABASE_URL contains `localhost` or `127.0.0.1`, automatically uses `host.docker.internal`
- **Docker Network**: If DATABASE_URL references a Docker container, uses `multitenant-network` (must exist)

### Manual Migration (if needed)

```bash
# Inside running container
docker exec -it phone-emulator npx prisma migrate deploy

# Or using Prisma CLI directly
npx prisma migrate deploy
```
