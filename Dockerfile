FROM oven/bun:1.2.21-alpine AS base
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files for dependency resolution
COPY package.json bun.lock turbo.json biome.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/schema/package.json ./packages/schema/

# Install all dependencies
RUN bun install --frozen-lockfile

# Copy all source code
COPY apps ./apps
COPY packages ./packages

# Build packages in correct dependency order
RUN bun run db:generate
RUN bun run build

FROM oven/bun:1.2.21-alpine AS api
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/turbo.json ./turbo.json
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/api ./apps/api

# Ensure Prisma client is available in the final container
RUN cd packages/db && bun run db:generate

WORKDIR /app/apps/api

# Create required directories
RUN mkdir -p /app/data /app/storage/photos /app/storage/signatures

# Set production environment
ENV NODE_ENV=production
ENV API_PORT=3001
ENV DATABASE_URL=file:/app/data/dev.db

EXPOSE 3001

# Use the start script which runs the built JS file
CMD ["bun", "run", "start"]

FROM oven/bun:1.2.21-alpine AS web-build
WORKDIR /app
RUN apk add --no-cache curl
COPY package.json bun.lock turbo.json biome.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/schema/package.json ./packages/schema/
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
RUN bun install --frozen-lockfile
COPY apps/web apps/web
COPY packages/schema packages/schema
COPY apps/api apps/api
COPY packages/db packages/db
RUN bun run --cwd apps/web build

FROM nginx:1.27-alpine AS web
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8000
CMD ["nginx","-g","daemon off;"]


