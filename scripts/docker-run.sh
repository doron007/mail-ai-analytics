#!/bin/bash
# Run Docker container locally for testing

set -e

IMAGE_NAME="mail-ai-analytics"
TAG="${1:-latest}"
PORT="${2:-3000}"

# Check if .env.local exists for environment variables
if [ -f .env.local ]; then
    echo "Loading environment from .env.local"
    ENV_FILE="--env-file .env.local"
else
    echo "Warning: .env.local not found. Set environment variables manually."
    ENV_FILE=""
fi

# Stop existing container if running
docker rm -f "$IMAGE_NAME" 2>/dev/null || true

echo "Starting container on port $PORT..."
docker run --name "$IMAGE_NAME" --rm -p "$PORT:3000" $ENV_FILE "$IMAGE_NAME:$TAG"
