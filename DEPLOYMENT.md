# Phone Emulator Deployment Guide

This guide explains how to deploy the Phone Emulator application using Docker.

## Prerequisites

- Docker installed and running on your system
- Git installed (for non-local deployments)
- Basic command line knowledge

## Quick Start

### 1. Fetch the Deployment Script

First, download the deployment script from GitHub:

```bash
curl -o deploy.sh https://raw.githubusercontent.com/HCL-CDP-TA/phone-emulator/main/deploy.sh
chmod +x deploy.sh
```

### 2. Run the Deployment

Deploy the latest version:

```bash
./deploy.sh
```

This will deploy the `main` branch in `production` mode on port **3100**.

## Deployment Options

### Deploy a Specific Version

Deploy a tagged release:

```bash
./deploy.sh v1.0.0 production
```

Deploy a specific branch:

```bash
./deploy.sh develop development
```

### Deploy from Local Directory

If you have the code checked out locally and want to deploy your current working directory:

```bash
./deploy.sh local development --local
```

Or simply:

```bash
./deploy.sh --local
```

This is useful for testing local changes before pushing to GitHub.

## Deployment Modes

### Production

```bash
./deploy.sh main production
```

- Port: 3100
- Environment: production
- Node environment: production
- Auto-restart: enabled

### Development

```bash
./deploy.sh main development
```

- Port: 3100
- Environment: development
- Node environment: development
- Auto-restart: enabled

### Staging

```bash
./deploy.sh main staging
```

- Port: 3100
- Environment: production
- Node environment: production
- Auto-restart: enabled

## Usage Examples

### Example 1: Deploy Latest Production

```bash
# Fetch and run deploy script
curl -o deploy.sh https://raw.githubusercontent.com/HCL-CDP-TA/phone-emulator/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### Example 2: Deploy Specific Release

```bash
./deploy.sh v1.2.3 production
```

### Example 3: Deploy from Local Changes

```bash
# Make your changes locally, then:
./deploy.sh local development --local
```

### Example 4: Deploy Development Branch

```bash
./deploy.sh develop development
```

## Accessing the Application

After successful deployment, the application will be available at:

```
http://localhost:3100
```

## Managing the Container

### View Logs

```bash
docker logs -f phone-emulator
```

### Stop the Container

```bash
docker stop phone-emulator
```

### Restart the Container

```bash
docker restart phone-emulator
```

### Remove the Container

```bash
docker rm -f phone-emulator
```

### Remove the Image

```bash
docker rmi phone-emulator:latest
```

## Troubleshooting

### Container Won't Start

Check the logs:

```bash
docker logs phone-emulator
```

### Port Already in Use

If port 3100 is already in use, you can modify the PORT variable in the deploy.sh script or stop the conflicting service.

### Docker Not Running

Ensure Docker Desktop (or Docker daemon) is running:

```bash
docker info
```

### Health Check Fails

The deploy script waits up to 60 seconds for the application to respond. If it fails:

1. Check if the container is running: `docker ps`
2. Check the logs: `docker logs phone-emulator`
3. Try accessing manually: `curl http://localhost:3100`

## Deployment Script Details

The deployment script performs the following steps:

1. **Validates** Docker is running
2. **Stops and removes** any existing container with the same name
3. **Prepares build context**:
   - For remote deployments: Clones the repository
   - For local deployments: Uses current directory
4. **Builds Docker image** with proper tags
5. **Starts new container** with appropriate configuration
6. **Health checks** the application
7. **Reports** deployment status and useful commands

## Advanced Configuration

### Changing the Port

Edit the deploy.sh script and modify the PORT variable in the environment-specific section:

```bash
case "$ENVIRONMENT" in
    "production")
        PORT=3100  # Change this to your desired port
        ...
```

### Container Auto-Restart

The container is configured with `--restart unless-stopped`, which means it will automatically restart on failure or system reboot, unless manually stopped.

## CI/CD Integration

To integrate with CI/CD pipelines:

```bash
# Download script
curl -o deploy.sh https://raw.githubusercontent.com/HCL-CDP-TA/phone-emulator/main/deploy.sh
chmod +x deploy.sh

# Deploy specific version
./deploy.sh $CI_COMMIT_TAG production
```

## Security Notes

- The application runs on port 3100 by default (not exposed to the internet by default)
- No sensitive configuration is required
- Container runs with standard Docker security settings

## Support

For issues or questions:

1. Check the logs: `docker logs phone-emulator`
2. Verify Docker is running: `docker info`
3. Ensure port 3100 is available: `lsof -i :3100`
4. Review the deployment script output for errors

## Version History

The application version is embedded in the Docker image during build. You can check the deployed version:

```bash
docker inspect phone-emulator | grep -A 5 Labels
```

This will show the version, commit hash, and other metadata.
