# syntax=docker/dockerfile:1.7

# Stage 1 — install all deps + compile TypeScript.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# Stage 2 — minimal runtime image.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/package.json ./package.json

USER app
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=6 \
  CMD wget -q --spider http://localhost:3000/healthz || exit 1

CMD ["node", "dist/index.js"]
