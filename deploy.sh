#!/usr/bin/env bash
# deploy.sh — deploy the Expo web build to Fly.io.
#
# Usage:
#   1. Copy .env.deploy.example to .env.deploy and fill in your Auth0 values.
#      (.env.deploy is gitignored.)
#   2. Make sure you have flyctl installed and are logged in:
#        curl -L https://fly.io/install.sh | sh
#        flyctl auth login
#   3. First time only: create the app
#        flyctl launch --no-deploy --copy-config --name nightcap --region syd
#      (or pick your own name/region; update fly.toml's `app` to match)
#   4. Run this script:
#        ./deploy.sh
#
# Build-arg values are read from .env.deploy and passed to the Docker build
# so EXPO_PUBLIC_* vars get baked into the static bundle at export time.

set -euo pipefail

cd "$(dirname "$0")"

ENV_FILE=".env.deploy"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found." >&2
  echo "Copy .env.deploy.example to $ENV_FILE and fill in the values." >&2
  exit 1
fi

# Load env file (KEY=VALUE lines, # comments OK)
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

required=(
  EXPO_PUBLIC_AUTH0_DOMAIN
  EXPO_PUBLIC_AUTH0_CLIENT_ID
  EXPO_PUBLIC_AUTH0_AUDIENCE
)

for var in "${required[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Error: $var is empty in $ENV_FILE" >&2
    exit 1
  fi
done

if ! command -v flyctl >/dev/null 2>&1; then
  echo "Error: flyctl not found in PATH." >&2
  echo "Install: curl -L https://fly.io/install.sh | sh" >&2
  exit 1
fi

echo "Deploying to Fly.io with EXPO_PUBLIC_* baked in as build args..."

flyctl deploy \
  --build-arg "EXPO_PUBLIC_AUTH0_DOMAIN=$EXPO_PUBLIC_AUTH0_DOMAIN" \
  --build-arg "EXPO_PUBLIC_AUTH0_CLIENT_ID=$EXPO_PUBLIC_AUTH0_CLIENT_ID" \
  --build-arg "EXPO_PUBLIC_AUTH0_AUDIENCE=$EXPO_PUBLIC_AUTH0_AUDIENCE" \
  "$@"

echo "Done. Open with: flyctl open"
