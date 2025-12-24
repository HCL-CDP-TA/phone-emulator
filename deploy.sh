#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
GITHUB_REPO="git@github.com:HCL-CDP-TA/phone-emulator.git"
APP_NAME="phone-emulator"
CONTAINER_NAME="phone-emulator"
IMAGE_NAME="phone-emulator"
HOST_PORT=3003
CONTAINER_PORT=3000
DOCKER_NETWORK="multitenant-network"
DEFAULT_SSH_KEY="$HOME/.ssh/id_ed25519"

# Check arguments
if [ "$#" -lt 2 ]; then
  echo -e "${RED}Usage: $0 <version-tag> <environment> [--local|--branch]${NC}"
  echo -e "Examples:"
  echo -e "  $0 v1.0.0 production"
  echo -e "  $0 v1.2.3 staging"
  echo -e "  $0 local development --local"
  echo -e "  $0 feature/my-branch development --branch"
  exit 1
fi

VERSION_TAG=$1
ENVIRONMENT=$2
USE_LOCAL=false
USE_BRANCH=false

# Save the original directory where deploy.sh is located
DEPLOY_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ "$3" == "--local" ]; then
  USE_LOCAL=true
elif [ "$3" == "--branch" ]; then
  USE_BRANCH=true
fi

echo -e "${GREEN}=== Phone Emulator Deployment ===${NC}"
echo -e "Version: ${YELLOW}$VERSION_TAG${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Port: ${YELLOW}$HOST_PORT${NC}"
echo ""

# Stop and remove existing container
echo -e "${YELLOW}[1/7] Stopping existing container...${NC}"
if docker ps -a | grep -q "$CONTAINER_NAME"; then
  docker stop "$CONTAINER_NAME" || true
  docker rm "$CONTAINER_NAME" || true
  echo -e "${GREEN}✓ Container stopped and removed${NC}"
else
  echo -e "${GREEN}✓ No existing container found${NC}"
fi

# Remove existing image
echo -e "${YELLOW}[2/7] Removing existing image...${NC}"
if docker images | grep -q "$IMAGE_NAME"; then
  docker rmi "$IMAGE_NAME:latest" || true
  echo -e "${GREEN}✓ Image removed${NC}"
else
  echo -e "${GREEN}✓ No existing image found${NC}"
fi

# Setup SSH key for GitHub access (if not using local)
if [ "$USE_LOCAL" = false ]; then
  # Use SSH key from .env or default
  SSH_KEY_PATH="${GITHUB_SSH_KEY_PATH:-$DEFAULT_SSH_KEY}"

  echo -e "${YELLOW}Checking SSH key for GitHub access...${NC}"

  # Check if SSH key exists
  if [ ! -f "$SSH_KEY_PATH" ]; then
    echo -e "${RED}ERROR: SSH key not found at $SSH_KEY_PATH${NC}"
    echo -e "${YELLOW}Please ensure your SSH key exists and is added to GitHub.${NC}"
    echo -e "${YELLOW}You can specify a custom path in .env: GITHUB_SSH_KEY_PATH=/path/to/key${NC}"
    exit 1
  fi

  # Check SSH key permissions
  KEY_PERMS=$(stat -f "%OLp" "$SSH_KEY_PATH" 2>/dev/null || stat -c "%a" "$SSH_KEY_PATH" 2>/dev/null)
  if [ "$KEY_PERMS" != "600" ] && [ "$KEY_PERMS" != "400" ]; then
    echo -e "${YELLOW}WARNING: SSH key has permissions $KEY_PERMS (should be 600 or 400)${NC}"
    echo -e "${YELLOW}Fixing permissions...${NC}"
    chmod 600 "$SSH_KEY_PATH"
  fi

  echo -e "${GREEN}✓ Using SSH key: $SSH_KEY_PATH${NC}"

  # Configure Git to use the SSH key and disable host key checking
  export GIT_SSH_COMMAND="ssh -i $SSH_KEY_PATH -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"
fi

# Clone or use local directory
if [ "$USE_LOCAL" = true ]; then
  echo -e "${YELLOW}[3/7] Using local directory...${NC}"
  BUILD_DIR="."
  COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
else
  echo -e "${YELLOW}[3/7] Cloning from GitHub...${NC}"
  BUILD_DIR="/tmp/phone-emulator-build-$$"
  rm -rf "$BUILD_DIR"
  git clone "$GITHUB_REPO" "$BUILD_DIR"
  cd "$BUILD_DIR"

  if [ "$USE_BRANCH" = true ]; then
    # Checkout specific branch
    git checkout "$VERSION_TAG"
    COMMIT_SHA=$(git rev-parse --short HEAD)
    echo -e "${GREEN}✓ Repository cloned and checked out to branch: $VERSION_TAG${NC}"
  else
    # Checkout tag (default behavior)
    git checkout "$VERSION_TAG"
    COMMIT_SHA=$(git rev-parse --short HEAD)
    echo -e "${GREEN}✓ Repository cloned and checked out to tag: $VERSION_TAG${NC}"
  fi
fi

# Build Docker image
echo -e "${YELLOW}[4/7] Building Docker image...${NC}"

# Sanitize VERSION_TAG for Docker (replace / with -)
DOCKER_TAG=$(echo "$VERSION_TAG" | sed 's/\//-/g')
IMAGE_TAG="$IMAGE_NAME:$DOCKER_TAG-$COMMIT_SHA"

if [ "$USE_LOCAL" = true ]; then
  docker build -t "$IMAGE_NAME:latest" -t "$IMAGE_TAG" .
else
  docker build -t "$IMAGE_NAME:latest" -t "$IMAGE_TAG" "$BUILD_DIR"
fi

echo -e "${GREEN}✓ Docker image built: $IMAGE_TAG${NC}"

# Get DATABASE_URL
if [ -f "$DEPLOY_DIR/.env" ]; then
  echo -e "${YELLOW}[5/7] Loading environment variables from .env...${NC}"
  export $(grep -v '^#' "$DEPLOY_DIR/.env" | xargs)

  # Determine database connection mode
  if [[ "$DATABASE_URL" == *"@localhost:"* ]] || [[ "$DATABASE_URL" == *"@127.0.0.1:"* ]]; then
    # Local PostgreSQL - use host.docker.internal for Mac/Windows
    DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/@localhost:/@host.docker.internal:/' | sed 's/@127.0.0.1:/@host.docker.internal:/')
    USE_DOCKER_NETWORK=false
    echo -e "${GREEN}✓ Database URL configured for host machine (via host.docker.internal)${NC}"
  else
    # Docker networked PostgreSQL
    USE_DOCKER_NETWORK=true

    echo -e "${YELLOW}[6/7] Checking Docker network...${NC}"
    if ! docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1; then
      echo -e "${RED}ERROR: Docker network '$DOCKER_NETWORK' does not exist${NC}"
      echo -e "${YELLOW}Please create it first:${NC}"
      echo -e "  docker network create $DOCKER_NETWORK"
      exit 1
    fi
    echo -e "${GREEN}✓ Docker network exists${NC}"
  fi
else
  echo -e "${RED}ERROR: .env file not found at $DEPLOY_DIR/.env${NC}"
  echo -e "${YELLOW}Please create a .env file in the same directory as deploy.sh${NC}"
  exit 1
fi

# Verify required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}ERROR: DATABASE_URL must be set in .env${NC}"
  exit 1
fi

# Run Docker container
echo -e "${YELLOW}[7/7] Starting container...${NC}"
if [ "$USE_DOCKER_NETWORK" = true ]; then
  # Use Docker network for containerized PostgreSQL
  docker run -d \
    --name "$CONTAINER_NAME" \
    --network "$DOCKER_NETWORK" \
    -p "$HOST_PORT:$CONTAINER_PORT" \
    -e DATABASE_URL="$DATABASE_URL" \
    -e NODE_ENV="$ENVIRONMENT" \
    -e SOCIAL_APP_KEY="${SOCIAL_APP_KEY:-}" \
    -e NEXT_PUBLIC_SOCIAL_APP_KEY="${NEXT_PUBLIC_SOCIAL_APP_KEY:-}" \
    -e NEXT_PUBLIC_SOCIAL_APP_BASE_URL="${NEXT_PUBLIC_SOCIAL_APP_BASE_URL:-}" \
    -e NEXT_PUBLIC_GEOFENCE_API_URL="${NEXT_PUBLIC_GEOFENCE_API_URL:-}" \
    -e NEXT_PUBLIC_GEOFENCE_API_KEY="${NEXT_PUBLIC_GEOFENCE_API_KEY:-}" \
    --restart unless-stopped \
    "$IMAGE_NAME:latest"
else
  # Use host.docker.internal for local PostgreSQL
  docker run -d \
    --name "$CONTAINER_NAME" \
    --add-host=host.docker.internal:host-gateway \
    -p "$HOST_PORT:$CONTAINER_PORT" \
    -e DATABASE_URL="$DATABASE_URL" \
    -e NODE_ENV="$ENVIRONMENT" \
    -e SOCIAL_APP_KEY="${SOCIAL_APP_KEY:-}" \
    -e NEXT_PUBLIC_SOCIAL_APP_KEY="${NEXT_PUBLIC_SOCIAL_APP_KEY:-}" \
    -e NEXT_PUBLIC_SOCIAL_APP_BASE_URL="${NEXT_PUBLIC_SOCIAL_APP_BASE_URL:-}" \
    -e NEXT_PUBLIC_GEOFENCE_API_URL="${NEXT_PUBLIC_GEOFENCE_API_URL:-}" \
    -e NEXT_PUBLIC_GEOFENCE_API_KEY="${NEXT_PUBLIC_GEOFENCE_API_KEY:-}" \
    --restart unless-stopped \
    "$IMAGE_NAME:latest"
fi

echo -e "${GREEN}✓ Container started${NC}"

# Wait for application to be ready
echo -e "${YELLOW}Waiting for application to start...${NC}"
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -sf "http://localhost:$HOST_PORT" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is running!${NC}"
    echo ""
    echo -e "${GREEN}=== Deployment Complete ===${NC}"
    echo -e "Application URL: ${YELLOW}http://localhost:$HOST_PORT${NC}"
    echo -e "Container Name: ${YELLOW}$CONTAINER_NAME${NC}"
    echo -e "Image: ${YELLOW}$IMAGE_TAG${NC}"
    echo ""
    echo -e "View logs: ${YELLOW}docker logs -f $CONTAINER_NAME${NC}"
    echo -e "Stop: ${YELLOW}docker stop $CONTAINER_NAME${NC}"
    exit 0
  fi

  ATTEMPT=$((ATTEMPT + 1))
  sleep 2
done

echo -e "${RED}ERROR: Application failed to start after $MAX_ATTEMPTS attempts${NC}"
echo -e "${YELLOW}Container logs:${NC}"
docker logs "$CONTAINER_NAME"
exit 1
