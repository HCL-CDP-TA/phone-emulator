# Multi-stage build for production deployment
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Build arguments
ARG NODE_ENV=production
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
ARG SOCIAL_APP_KEY=changeme
ARG NEXT_PUBLIC_SOCIAL_APP_KEY=changeme
ARG NEXT_PUBLIC_SOCIAL_APP_BASE_URL=https://social.demo.now.hclsoftware.cloud
ARG NEXT_PUBLIC_GEOFENCE_API_URL
ARG NEXT_PUBLIC_GEOFENCE_API_KEY

# Set environment variables for build (needed for Next.js to embed NEXT_PUBLIC_* vars)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SOCIAL_APP_KEY=$SOCIAL_APP_KEY
ENV NEXT_PUBLIC_SOCIAL_APP_KEY=$NEXT_PUBLIC_SOCIAL_APP_KEY
ENV NEXT_PUBLIC_SOCIAL_APP_BASE_URL=$NEXT_PUBLIC_SOCIAL_APP_BASE_URL
ENV NEXT_PUBLIC_GEOFENCE_API_URL=$NEXT_PUBLIC_GEOFENCE_API_URL
ENV NEXT_PUBLIC_GEOFENCE_API_KEY=$NEXT_PUBLIC_GEOFENCE_API_KEY

# Build the application
RUN npm run build

# Ensure public directory exists (create empty one if needed)
RUN mkdir -p /app/public

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install postgresql-client and OpenSSL for Prisma
RUN apk add --no-cache postgresql-client openssl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy Prisma for migrations - copy all Prisma packages and dependencies
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin

# Copy built application from standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy docker entrypoint script
COPY --chmod=755 docker-entrypoint.sh /docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NPM_CONFIG_CACHE=/app/.npm-cache

# Create npm cache directory with proper permissions
RUN mkdir -p /app/.npm-cache && chown -R nextjs:nodejs /app/.npm-cache

# Add labels for metadata
LABEL org.opencontainers.image.title="Phone Emulator"
LABEL org.opencontainers.image.description="Realistic smartphone emulator for demonstrating martech software"
LABEL org.opencontainers.image.source="https://github.com/HCL-CDP-TA/phone-emulator"

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Use entrypoint for database setup and migrations
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
