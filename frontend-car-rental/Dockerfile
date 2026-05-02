# syntax=docker/dockerfile:1.7

# Stage 1 — build the Vite bundle. Vite inlines VITE_* env at build time,
# so they must arrive as --build-arg, not runtime -e.
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2 — serve the static bundle with nginx.
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
