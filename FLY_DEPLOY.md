# Deploying to Fly.io

This deploys the Expo web export as a static site behind nginx.

## Files

- `Dockerfile` — multi-stage: builds `expo export --platform web`, then serves with nginx.
- `nginx.conf` — SPA-aware fallback for expo-router routes, long-cache for `/_expo` and `/assets`, `/healthz` endpoint.
- `fly.toml` — Fly app config (port 8080, auto-stop, health check on `/healthz`).
- `.dockerignore` — keeps node_modules, .git, .env etc. out of the build context.
- `deploy.sh` — wraps `flyctl deploy`, passing your local `.env.deploy` values as Docker build args.
- `.env.deploy.example` — template for the Auth0 env values.

## One-time setup

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Log in
flyctl auth login

# Create the app (skip deploying — we want to deploy with build args)
flyctl launch --no-deploy --copy-config --name roadside-rooms --region syd
# (Pick any region you like; `syd` is closest to AU. Update fly.toml's `app`
#  field if you choose a different name.)

# Copy and fill in env values
cp .env.deploy.example .env.deploy
$EDITOR .env.deploy
```

## Deploying

```bash
./deploy.sh
```

The script reads `.env.deploy` and runs:

```
flyctl deploy \
  --build-arg EXPO_PUBLIC_AUTH0_DOMAIN=... \
  --build-arg EXPO_PUBLIC_AUTH0_CLIENT_ID=... \
  --build-arg EXPO_PUBLIC_AUTH0_AUDIENCE=...
```

Open the deployed app:

```bash
flyctl open
```

## Why build args (not Fly secrets)?

`EXPO_PUBLIC_*` env vars are inlined into the JS bundle by Metro at
`expo export` time. They have to be present **during the Docker build**, not
at runtime. Fly secrets are only injected into the running container, which is
too late for a static export — so we use Docker build args instead.

If you ever add a server component that needs runtime secrets, switch those to
`flyctl secrets set` and read them via `process.env` server-side.

## Auth0 callback URLs

Don't forget to add your Fly URL (e.g. `https://nightcap.fly.dev`) to your
Auth0 application's **Allowed Callback URLs**, **Allowed Logout URLs**, and
**Allowed Web Origins**.
