#!/bin/bash
# Build Docker image for mail-ai-analytics

set -e

IMAGE_NAME="mail-ai-analytics"
TAG="${1:-latest}"

echo "Building Docker image: $IMAGE_NAME:$TAG"

# Load NEXT_PUBLIC_* env vars from .env.local for build-time embedding
if [ -f .env.local ]; then
    export $(grep -E '^NEXT_PUBLIC_' .env.local | xargs)
fi

docker build \
    --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -t "$IMAGE_NAME:$TAG" .

echo ""
echo "Build complete!"
echo "Image: $IMAGE_NAME:$TAG"
docker images "$IMAGE_NAME:$TAG" --format "Size: {{.Size}}"
