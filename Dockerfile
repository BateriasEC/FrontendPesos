# syntax=docker/dockerfile:1

# SPA Vite/React: el runtime solo sirve `dist`. El API es otro contenedor.
FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:3000/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:22-alpine AS runtime
WORKDIR /app

RUN npm install --omit=dev -g serve@14.2.4

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
