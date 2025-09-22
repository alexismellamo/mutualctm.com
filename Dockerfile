FROM oven/bun:1.2.21-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl
COPY package.json bun.lock turbo.json biome.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/schema/package.json ./packages/schema/
RUN bun install --frozen-lockfile
COPY apps/api ./apps/api
COPY apps/web ./apps/web
COPY packages/db ./packages/db
COPY packages/schema ./packages/schema
RUN bun --cwd packages/db run db:generate
RUN bun --cwd apps/web run build
RUN bun --cwd apps/api run build

FROM oven/bun:1.2.21-alpine AS api
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=base /app /app
RUN bun --cwd /app/packages/db run db:generate
RUN bun --cwd /app/apps/api run build
WORKDIR /app/apps/api
ENV NODE_ENV=development
ENV API_PORT=3001
ENV DATABASE_URL=file:/app/data/dev.db
EXPOSE 3001
CMD ["bun","/app/apps/api/dist/index.js"]

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
CMD ["nginx","-g","daemon off;"]


