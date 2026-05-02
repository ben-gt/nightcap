# syntax=docker/dockerfile:1.7

# ---- Build stage: produce the Expo web static export ----
FROM node:20-alpine AS builder

WORKDIR /app

# Build args for Expo public env vars (baked into the JS bundle at export time).
# These must be passed via `flyctl deploy --build-arg KEY=VALUE` (or similar),
# never committed to source.
ARG EXPO_PUBLIC_AUTH0_DOMAIN
ARG EXPO_PUBLIC_AUTH0_CLIENT_ID
ARG EXPO_PUBLIC_AUTH0_AUDIENCE

ENV EXPO_PUBLIC_AUTH0_DOMAIN=$EXPO_PUBLIC_AUTH0_DOMAIN \
    EXPO_PUBLIC_AUTH0_CLIENT_ID=$EXPO_PUBLIC_AUTH0_CLIENT_ID \
    EXPO_PUBLIC_AUTH0_AUDIENCE=$EXPO_PUBLIC_AUTH0_AUDIENCE \
    CI=1

# Install deps first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source and run the static web export
COPY . .
RUN npx expo export --platform web --output-dir dist

# ---- Runtime stage: serve the static bundle with nginx ----
FROM nginx:1.27-alpine AS runtime

# SPA-aware nginx config (handles expo-router client-side routes)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static site
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
