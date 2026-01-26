#!/bin/bash
# Deploy to Azure Container Apps
# Usage: ./scripts/azure-deploy.sh [build-only]

set -e

# Configuration
RESOURCE_GROUP="rg-mail-ai-analytics"
LOCATION="westus"
ENVIRONMENT="cae-mail-ai-analytics"
APP_NAME="ca-mail-ai-analytics"
IMAGE_NAME="mail-ai-analytics"

# Existing ACR configuration
ACR_NAME="sefenergy"
ACR_SERVER="sefenergy.azurecr.io"
ACR_USERNAME="sefenergy"

echo "=== Azure Container Apps Deployment ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "ACR: $ACR_SERVER"
echo "App: $APP_NAME"
echo ""

# Check if logged in to Azure
if ! az account show &>/dev/null; then
    echo "Not logged in to Azure. Running 'az login'..."
    az login
fi

# Login to ACR
echo "Logging in to ACR..."
az acr login --name "$ACR_NAME"

# Load environment variables from .env.local for build args
if [ -f ".env.local" ]; then
    echo "Loading build variables from .env.local..."
    export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
fi

# Check required build args
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "ERROR: NEXT_PUBLIC_SUPABASE_URL is required for build"
    echo "Set it in .env.local or as an environment variable"
    exit 1
fi
if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is required for build"
    echo "Set it in .env.local or as an environment variable"
    exit 1
fi

# Get git commit hash for version footer
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "Git commit: $GIT_COMMIT"

# CalVer versioning (YYYY.MM.DD or YYYY.MM.DD.N for multiple deploys/day)
TODAY=$(date +%Y.%m.%d)
echo "Checking for existing deployments today..."

# Check how many tags exist for today
EXISTING_TAGS=$(az acr repository show-tags --name "$ACR_NAME" --repository "$IMAGE_NAME" --query "[?starts_with(@, '$TODAY')]" -o tsv 2>/dev/null | wc -l | tr -d ' ')

if [ "$EXISTING_TAGS" -eq "0" ]; then
    VERSION="$TODAY"
else
    VERSION="$TODAY.$((EXISTING_TAGS + 1))"
fi
echo "Version: $VERSION"

# Build and push image with both :latest and :version tags
# Pass NEXT_PUBLIC_* as build args (required at build time for Next.js)
echo "Building and pushing image to ACR..."
az acr build --registry "$ACR_NAME" \
    --image "$IMAGE_NAME:latest" \
    --image "$IMAGE_NAME:$VERSION" \
    --build-arg "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL" \
    --build-arg "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    --build-arg "NEXT_PUBLIC_GIT_COMMIT=$GIT_COMMIT" \
    .

if [ "$1" = "build-only" ]; then
    echo "Build complete. Skipping deployment."
    exit 0
fi

# Get ACR password (or use environment variable)
if [ -z "$ACR_PASSWORD" ]; then
    echo ""
    echo "ACR_PASSWORD not set. Fetching from Azure..."
    ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)
fi

# Check if resource group exists, create if needed
if ! az group show --name "$RESOURCE_GROUP" &>/dev/null; then
    echo "Creating resource group..."
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
fi

# Check if Container Apps environment exists, create if needed
if ! az containerapp env show --name "$ENVIRONMENT" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    echo "Creating Container Apps environment..."
    az containerapp env create \
        --name "$ENVIRONMENT" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION"
fi

# Check if app exists
if az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    echo "Updating existing container app..."
    # Use versioned tag to force new revision (not :latest which can be cached)
    az containerapp update \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --image "$ACR_SERVER/$IMAGE_NAME:$VERSION"
else
    echo "Creating new container app..."
    echo ""
    echo "NOTE: You need to set environment variables after creation:"
    echo "  N8N_WEBHOOK_URL - Your n8n webhook URL"
    echo "  NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL"
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anon key"
    echo ""

    az containerapp create \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$ENVIRONMENT" \
        --image "$ACR_SERVER/$IMAGE_NAME:latest" \
        --target-port 3000 \
        --ingress external \
        --registry-server "$ACR_SERVER" \
        --registry-username "$ACR_USERNAME" \
        --registry-password "$ACR_PASSWORD" \
        --cpu 0.5 \
        --memory 1.0Gi \
        --min-replicas 0 \
        --max-replicas 3
fi

# Update environment variables (always run to ensure they're current)
echo ""
echo "Updating environment variables..."

# Check if env vars are set, prompt if not
if [ -z "$N8N_WEBHOOK_URL" ]; then
    echo "Warning: N8N_WEBHOOK_URL not set in environment"
fi
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "Warning: NEXT_PUBLIC_SUPABASE_URL not set in environment"
fi

# Set environment variables from .env.local if they exist, otherwise use environment
if [ -f ".env.local" ]; then
    echo "Loading environment variables from .env.local..."
    export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
fi

az containerapp update \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --set-env-vars \
        "N8N_WEBHOOK_URL=$N8N_WEBHOOK_URL" \
        "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL" \
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        "AUTH_SECRET=$AUTH_SECRET" \
        "N8N_AUTH_EMAIL_WEBHOOK=$N8N_AUTH_EMAIL_WEBHOOK"

# Get app URL
echo ""
echo "=== Deployment Complete ==="
APP_URL=$(az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.configuration.ingress.fqdn" -o tsv)
echo "App URL: https://$APP_URL"
echo "Version: $VERSION"
echo ""
echo "To rollback: az containerapp update --name $APP_NAME --resource-group $RESOURCE_GROUP --image $ACR_SERVER/$IMAGE_NAME:<version>"
echo "Example:     az containerapp update --name $APP_NAME --resource-group $RESOURCE_GROUP --image $ACR_SERVER/$IMAGE_NAME:2026.01.25"
