FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS build
WORKDIR /app
ARG APP_ENV
ARG APP_URL
ARG APP_DOMAIN
ARG SERVER_URL
ENV APP_ENV=$APP_ENV
ENV APP_URL=$APP_URL
ENV APP_DOMAIN=$APP_DOMAIN
ENV SERVER_URL=$SERVER_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
