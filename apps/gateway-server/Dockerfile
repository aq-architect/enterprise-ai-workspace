# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /workspace
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /workspace
COPY --from=deps /workspace/node_modules ./node_modules
COPY package.json package-lock.json* nx.json tsconfig.base.json workspace.json ./
COPY apps/gateway-server ./apps/gateway-server
COPY libs ./libs
RUN cd apps/gateway-server && npx nest build

FROM node:20-alpine AS runner
WORKDIR /workspace
ENV NODE_ENV=production
RUN apk add --no-cache wget
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /workspace/dist/apps/gateway-server ./dist/apps/gateway-server

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/docs-json >/dev/null || exit 1

CMD ["node", "dist/apps/gateway-server/main.js"]
